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
        className="neo-brutalist-editor"
      />
      <style jsx>{`
        .rich-text-editor :global(.ql-container) {
          border: 4px solid black !important;
          border-top: none !important;
          font-family: 'Inter', sans-serif;
          font-size: 16px;
        }
        
        .rich-text-editor :global(.ql-toolbar) {
          border: 4px solid black !important;
          border-bottom: none !important;
          background: white;
        }
        
        .rich-text-editor :global(.ql-editor) {
          min-height: 200px;
          padding: 16px;
        }
        
        .rich-text-editor :global(.ql-editor.ql-blank::before) {
          color: #9ca3af;
          font-style: normal;
        }
        
        .rich-text-editor :global(.ql-stroke) {
          stroke: black !important;
        }
        
        .rich-text-editor :global(.ql-fill) {
          fill: black !important;
        }
        
        .rich-text-editor :global(.ql-picker-label) {
          color: black !important;
        }
        
        .rich-text-editor :global(.ql-toolbar button:hover),
        .rich-text-editor :global(.ql-toolbar button:focus),
        .rich-text-editor :global(.ql-toolbar button.ql-active) {
          background: #fef08a !important;
        }
        
        .rich-text-editor :global(.ql-toolbar .ql-stroke:hover),
        .rich-text-editor :global(.ql-toolbar button:hover .ql-stroke),
        .rich-text-editor :global(.ql-toolbar button.ql-active .ql-stroke) {
          stroke: black !important;
        }
        
        .rich-text-editor :global(.ql-toolbar .ql-fill:hover),
        .rich-text-editor :global(.ql-toolbar button:hover .ql-fill),
        .rich-text-editor :global(.ql-toolbar button.ql-active .ql-fill) {
          fill: black !important;
        }
      `}</style>
    </div>
  )
}

export default RichTextEditor
