import { useState } from "react";
import { Comment } from "../data/types";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";
import { MessageSquare } from "lucide-react";

interface VisitorLogProps {
  comments: Comment[];
  onAddComment?: (author: string, text: string) => void;
  onDeleteComment?: (commentId: string) => void;
}

export function VisitorLog({ comments, onAddComment, onDeleteComment }: VisitorLogProps) {
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  const canAddComment = Boolean(onAddComment);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (author.trim() && text.trim() && onAddComment) {
      onAddComment(author, text);
      setAuthor("");
      setText("");
      setIsAddingComment(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-[#d4a743]" />
          <h3 className="text-2xl text-[#2c3e50] tracking-wide">Visitor Log</h3>
        </div>
      </div>

      {canAddComment && !isAddingComment && (
        <div className="text-center">
          <Button 
            onClick={() => setIsAddingComment(true)}
            className="bg-gradient-to-r from-[#c9a961] to-[#d4a743] hover:from-[#b8925a] hover:to-[#c9a961] text-white shadow-lg"
          >
            Sign the Guestbook
          </Button>
        </div>
      )}

      {canAddComment && isAddingComment && (
        <Card className="border border-gray-200 bg-white shadow-lg">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-[#2c3e50]">Your Name</label>
                <Input 
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Enter your name"
                  className="bg-white border-gray-200 text-[#2c3e50]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-2 text-[#2c3e50]">Your Entry</label>
                <Textarea 
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Share your memories or add additional details..."
                  rows={4}
                  className="bg-white border-gray-200 text-[#2c3e50]"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-[#c9a961] to-[#d4a743] hover:from-[#b8925a] hover:to-[#c9a961] text-white"
                >
                  Submit Entry
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  className="border-gray-200 text-[#5a6c7d] hover:bg-gray-50"
                  onClick={() => {
                    setIsAddingComment(false);
                    setAuthor("");
                    setText("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4 mt-8">
        {comments.length === 0 ? (
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-6 text-center text-gray-400 italic text-sm">
              {canAddComment ? 'No entries yet. Be the first to sign the guestbook.' : 'No guestbook entries were included in this export.'}
            </CardContent>
          </Card>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="hover:shadow-xl transition-shadow bg-white border border-gray-200">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#c9a961] to-[#d4a743] rounded-full flex items-center justify-center shadow-md">
                      <span className="text-lg text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {comment.author.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-[#2c3e50]" style={{ fontFamily: "'Playfair Display', serif" }}>{comment.author}</div>
                      <div className="text-sm text-[#6b7c8d]">{comment.date}</div>
                    </div>
                  </div>
                  {onDeleteComment && (
                    <button
                      onClick={() => onDeleteComment(comment.id)}
                      className="text-xs text-gray-300 hover:text-red-400 transition-colors opacity-60 hover:opacity-100"
                      title="Delete entry"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <p className="text-[#5a6c7d] leading-relaxed">{comment.text}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}