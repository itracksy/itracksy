import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Code,
  Heading2,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write something...",
  className,
}: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState<string>("");
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false, // Disable default behavior
        autolink: true, // Automatically detect links in pasted content
        linkOnPaste: true,
        HTMLAttributes: {
          class: "text-primary underline",
          rel: "noopener noreferrer",
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: "task-item",
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const handleAddLink = () => {
    // Check if we have a valid URL
    if (linkUrl) {
      // Ensure the URL has a protocol, add http:// if missing
      const url =
        linkUrl.startsWith("http://") || linkUrl.startsWith("https://")
          ? linkUrl
          : `https://${linkUrl}`;

      // Set the link on the selected text
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();

      // Reset and close
      setLinkUrl("");
      setIsLinkPopoverOpen(false);
    }
  };

  const handleRemoveLink = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setIsLinkPopoverOpen(false);
  };

  return (
    <div className={cn("overflow-hidden rounded-md border", className)}>
      <div className="flex flex-wrap gap-1 border-b bg-muted/50 p-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-muted" : ""}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-muted" : ""}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive("heading", { level: 2 }) ? "bg-muted" : ""}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "bg-muted" : ""}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "bg-muted" : ""}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={editor.isActive("taskList") ? "bg-muted" : ""}
        >
          <CheckSquare className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive("codeBlock") ? "bg-muted" : ""}
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive("blockquote") ? "bg-muted" : ""}
        >
          <Quote className="h-4 w-4" />
        </Button>

        <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={editor.isActive("link") ? "bg-muted" : ""}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3">
            <div className="space-y-2">
              <div className="space-y-1">
                <label htmlFor="link-url" className="text-xs font-medium">
                  URL
                </label>
                <div className="flex gap-2">
                  <Input
                    id="link-url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleAddLink}>
                    Add
                  </Button>
                </div>
              </div>
              {editor.isActive("link") && (
                <Button size="sm" variant="destructive" onClick={handleRemoveLink}>
                  Remove Link
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex-1"></div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent
        editor={editor}
        className="prose prose-sm min-h-[150px] max-w-none bg-white p-3 text-black focus-visible:outline-none prose-headings:text-black prose-p:text-black prose-blockquote:text-black prose-strong:text-black prose-em:text-black prose-code:text-black prose-pre:text-black prose-ol:text-black prose-ul:text-black prose-li:text-black dark:bg-transparent dark:text-white dark:prose-headings:text-white dark:prose-p:text-white dark:prose-blockquote:text-white dark:prose-strong:text-white dark:prose-em:text-white dark:prose-code:text-white dark:prose-pre:text-white dark:prose-ol:text-white dark:prose-ul:text-white dark:prose-li:text-white [&_*:focus-visible]:outline-none [&_.task-item_p]:my-0 [&_.task-list]:pl-0 [&_.task-list_li]:list-none"
      />
    </div>
  );
}
