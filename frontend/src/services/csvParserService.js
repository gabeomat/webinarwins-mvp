import Papa from 'papaparse'
import { supabase } from '../contexts/AuthContext'

export function calculateEngagementScore(focusPercent, attendancePercent, messageCount, questionCount) {
  const focusScore = (focusPercent || 0) * 0.35
  const attendanceScore = (attendancePercent || 0) * 0.30
  const messageScore = Math.min(messageCount * 5, 25)
  const questionScore = Math.min(questionCount * 2.5, 10)

  const totalScore = focusScore + attendanceScore + messageScore + questionScore
  return Math.round(Math.min(totalScore, 100))
}

export function determineEngagementTier(engagementScore, attended) {
  if (!attended) {
    return 'No-Show'
  }

  if (engagementScore >= 80) return 'Hot Lead'
  if (engagementScore >= 60) return 'Warm Lead'
  if (engagementScore >= 40) return 'Cool Lead'
  return 'Cold Lead'
}

function normalizeEmail(email) {
  return email ? email.trim().toLowerCase() : ''
}

function detectQuestions(messageText) {
  const lowerMessage = messageText.toLowerCase()
  const questionWords = ['how', 'what', 'when', 'where', 'why', 'who', 'can', 'could', 'would', 'should', 'is', 'are', 'do', 'does']

  if (messageText.includes('?')) {
    return true
  }

  const firstWord = lowerMessage.split(' ')[0]
  return questionWords.includes(firstWord)
}

export async function parseAttendanceCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const attendees = results.data.map(row => {
            const name = row['Name'] || row['name'] || row['Attendee Name'] || ''
            const email = normalizeEmail(row['Email'] || row['email'] || row['Email Address'] || '')

            const attendanceStr = row['Attendance %'] || row['attendance_percent'] || row['Attendance'] || '0'
            const focusStr = row['Focus %'] || row['focus_percent'] || row['Focus'] || '0'
            const minutesStr = row['Attendance Minutes'] || row['attendance_minutes'] || row['Minutes'] || '0'

            const attendancePercent = parseFloat(attendanceStr.toString().replace('%', '')) || 0
            const focusPercent = parseFloat(focusStr.toString().replace('%', '')) || 0
            const attendanceMinutes = parseFloat(minutesStr) || 0

            const attended = attendancePercent > 0 || attendanceMinutes > 0

            let joinTime = null
            let exitTime = null
            const joinStr = row['Join Time'] || row['join_time'] || ''
            const exitStr = row['Exit Time'] || row['exit_time'] || ''

            if (joinStr) {
              joinTime = new Date(joinStr).toISOString()
            }
            if (exitStr) {
              exitTime = new Date(exitStr).toISOString()
            }

            const location = row['Location'] || row['location'] || ''

            return {
              name,
              email,
              attended,
              attendance_percent: attendancePercent,
              focus_percent: focusPercent,
              attendance_minutes: attendanceMinutes,
              join_time: joinTime,
              exit_time: exitTime,
              location,
            }
          }).filter(attendee => attendee.name && attendee.email)

          resolve(attendees)
        } catch (error) {
          reject(new Error(`Failed to parse attendance CSV: ${error.message}`))
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`))
      }
    })
  })
}

export async function parseChatCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const messages = results.data.map(row => {
            const name = row['Name'] || row['name'] || row['Attendee Name'] || ''
            const email = normalizeEmail(row['Email'] || row['email'] || row['Email Address'] || '')
            const messageText = row['Message'] || row['message'] || row['Chat Message'] || ''

            let timestamp = null
            const timestampStr = row['Timestamp'] || row['timestamp'] || row['Time'] || ''
            if (timestampStr) {
              timestamp = new Date(timestampStr).toISOString()
            }

            const isQuestion = detectQuestions(messageText)

            return {
              name,
              email,
              message_text: messageText,
              timestamp,
              is_question: isQuestion,
            }
          }).filter(msg => msg.message_text && msg.email)

          resolve(messages)
        } catch (error) {
          reject(new Error(`Failed to parse chat CSV: ${error.message}`))
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`))
      }
    })
  })
}

export function matchChatMessagesToAttendees(attendees, messages) {
  const messagesByEmail = {}

  messages.forEach(msg => {
    const email = normalizeEmail(msg.email)
    if (!messagesByEmail[email]) {
      messagesByEmail[email] = []
    }
    messagesByEmail[email].push(msg)
  })

  return messagesByEmail
}

export async function createWebinarWithData(webinarData, attendees, messages, userId) {
  try {
    const { data: webinar, error: webinarError } = await supabase
      .from('webinars')
      .insert({
        user_id: userId,
        title: webinarData.title,
        topic: webinarData.topic || '',
        offer_name: webinarData.offer_name || '',
        offer_description: webinarData.offer_description || '',
        price: parseFloat(webinarData.price) || 0,
        deadline: webinarData.deadline || '',
        replay_url: webinarData.replay_url || '',
        date_hosted: new Date().toISOString(),
      })
      .select()
      .single()

    if (webinarError) throw webinarError

    const messagesByEmail = matchChatMessagesToAttendees(attendees, messages)

    const attendeeInserts = []

    for (const attendee of attendees) {
      const email = normalizeEmail(attendee.email)
      const attendeeMessages = messagesByEmail[email] || []
      const messageCount = attendeeMessages.length
      const questionCount = attendeeMessages.filter(m => m.is_question).length

      const engagementScore = calculateEngagementScore(
        attendee.focus_percent,
        attendee.attendance_percent,
        messageCount,
        questionCount
      )

      const engagementTier = determineEngagementTier(engagementScore, attendee.attended)

      const { data: attendeeData, error: attendeeError } = await supabase
        .from('attendees')
        .insert({
          webinar_id: webinar.id,
          name: attendee.name,
          email: attendee.email,
          attended: attendee.attended,
          attendance_percent: attendee.attendance_percent,
          focus_percent: attendee.focus_percent,
          attendance_minutes: attendee.attendance_minutes,
          join_time: attendee.join_time,
          exit_time: attendee.exit_time,
          location: attendee.location,
          engagement_score: engagementScore,
          engagement_tier: engagementTier,
        })
        .select()
        .single()

      if (attendeeError) throw attendeeError

      if (attendeeMessages.length > 0) {
        const chatInserts = attendeeMessages.map(msg => ({
          attendee_id: attendeeData.id,
          message_text: msg.message_text,
          timestamp: msg.timestamp,
          is_question: msg.is_question,
        }))

        const { error: chatError } = await supabase
          .from('chat_messages')
          .insert(chatInserts)

        if (chatError) throw chatError
      }

      attendeeInserts.push(attendeeData)
    }

    return {
      webinar,
      attendees: attendeeInserts,
      stats: {
        total_registrants: attendees.length,
        total_attendees: attendees.filter(a => a.attended).length,
        total_messages: messages.length,
        hot_leads: attendeeInserts.filter(a => a.engagement_tier === 'Hot Lead').length,
        warm_leads: attendeeInserts.filter(a => a.engagement_tier === 'Warm Lead').length,
        cool_leads: attendeeInserts.filter(a => a.engagement_tier === 'Cool Lead').length,
        cold_leads: attendeeInserts.filter(a => a.engagement_tier === 'Cold Lead').length,
        no_shows: attendeeInserts.filter(a => a.engagement_tier === 'No-Show').length,
      }
    }
  } catch (error) {
    console.error('Error creating webinar:', error)
    throw error
  }
}
