import React from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

const RichTextEditor = ({ value, onChange, placeholder = 'Start typing...', className = '' }) => {
  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      ['link'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ]
  }

  const formats = [
    'bold', 'italic', 'underline',
    'link',
    'list', 'bullet'
  ]

  return (
    <div className={`rich-text-editor ${className}`}>
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
      />
    </div>
  )
}

export default RichTextEditor
