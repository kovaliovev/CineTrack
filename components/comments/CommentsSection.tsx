// components/comments/CommentsSection.tsx
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Comment } from '@/lib/types'

interface Props {
  tmdbId: number
  currentUserId: string
}

export default function CommentsSection({ tmdbId, currentUserId }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [body, setBody] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBody, setEditBody] = useState('')
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('comments')
      .select('*')
      .eq('tmdb_id', tmdbId)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setComments(data) })
  }, [tmdbId])

  async function addComment() {
    if (!body.trim()) return
    const { data, error } = await supabase
      .from('comments')
      .insert({ tmdb_id: tmdbId, body: body.trim() })
      .select()
      .single()
    if (!error && data) {
      setComments(prev => [...prev, data])
      setBody('')
    }
  }

  async function updateComment(id: string, newBody: string) {
    const { error } = await supabase
      .from('comments')
      .update({ body: newBody })
      .eq('id', id)
    if (!error) {
      setComments(prev => prev.map(c => c.id === id ? { ...c, body: newBody } : c))
      setEditingId(null)
    }
  }

  async function deleteComment(id: string) {
    const { error } = await supabase.from('comments').delete().eq('id', id)
    if (!error) setComments(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="mt-6">
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">Comments</h3>

      <div className="space-y-3 mb-4">
        {comments.map(comment => (
          <div key={comment.id} className="bg-bg-elevated rounded-lg p-3">
            {editingId === comment.id ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={editBody}
                  onChange={e => setEditBody(e.target.value)}
                  className="w-full bg-bg-base border border-bg-border rounded p-2 text-sm text-text-primary outline-none focus:border-cinema-red resize-none"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => updateComment(comment.id, editBody)}
                    className="text-xs px-3 py-1 bg-cinema-red text-white rounded hover:opacity-90 transition-opacity"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-xs px-3 py-1 text-text-muted hover:text-text-secondary transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-text-primary">{comment.body}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs text-text-muted">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                  {comment.user_id === currentUserId && (
                    <>
                      <button
                        onClick={() => { setEditingId(comment.id); setEditBody(comment.body) }}
                        className="text-xs text-text-muted hover:text-text-secondary transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteComment(comment.id)}
                        className="text-xs text-text-muted hover:text-cinema-red transition-colors"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-text-muted">No comments yet.</p>
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addComment()}
          placeholder="Add a comment…"
          className="flex-1 bg-bg-elevated border border-bg-border rounded-lg px-3 py-2 text-sm outline-none focus:border-cinema-red transition-colors"
        />
        <button
          onClick={addComment}
          className="px-3 py-2 bg-cinema-red text-white text-sm rounded-lg hover:opacity-90 transition-opacity"
        >
          Post
        </button>
      </div>
    </div>
  )
}
