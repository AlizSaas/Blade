import { toast } from "sonner";
import { useUploadThing } from "@/lib/uploadthing";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

export interface Attachment {
  file: File;
  mediaId?: string;
  isUploading: boolean;
  url?: string; // Added URL field for easier access
}

export default function useMediaUpload() {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>();

  const { startUpload, isUploading } = useUploadThing("bikeRequestImage", {
    onBeforeUploadBegin(files) {
      // Rename files to avoid conflicts
      const renamedFiles = files.map((file) => {
        const extension = file.name.split(".").pop();
        return new File(
          [file],
          `bikerequest-${crypto.randomUUID()}.${extension}`,
          { type: file.type }
        );
      });

      // Add new attachments to state
      setAttachments((prev) => [
        ...prev,
        ...renamedFiles.map((file) => ({ 
          file, 
          isUploading: true 
        })),
      ]);

      return renamedFiles;
    },

    onUploadProgress: setUploadProgress,

    onClientUploadComplete(res) {
      console.log("Upload completed:", res);
      
      setAttachments((prev) =>
        prev.map((attachment) => {
          const uploadResult = res.find((r) => r.name === attachment.file.name);
          
          if (!uploadResult) return attachment;

          // The server response should now have the correct structure
          const serverData = uploadResult.serverData;
          const fileUrl = uploadResult.url; // Direct URL from UploadThing
          
          // Use server data URL if available, otherwise fall back to direct URL
          const finalUrl = serverData?.url || fileUrl;

          return {
            ...attachment,
            mediaId: uploadResult.key, // Use the file key as mediaId
            url: finalUrl, // Store the accessible URL
            isUploading: false,
          };
        })
      );
      
      setUploadProgress(undefined); // Reset progress
      toast.success("Image uploaded successfully!");
    },

    onUploadError(error) {
      console.error("Upload error:", error);
      
      // Remove failed uploads from state
      setAttachments((prev) => prev.filter((a) => !a.isUploading));
      
      setUploadProgress(undefined); // Reset progress
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  function handleStartUpload(files: File[]) {
    if (isUploading) {
      toast.error("An upload is already in progress. Please wait until it finishes.");
      return;
    }

    if (attachments.length + files.length > 1) {
      toast.error("You can only upload 1 image at a time.");
      return;
    }

    // Validate file types
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      toast.error("Please upload only JPEG, PNG, WebP, or GIF images.");
      return;
    }

    // Validate file sizes (4MB max as per your router config)
    const maxSize = 4 * 1024 * 1024; // 4MB in bytes
    const oversizedFiles = files.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      toast.error("Images must be smaller than 4MB.");
      return;
    }

    startUpload(files);
  }

  function removeAttachment(fileName: string) {
    setAttachments((prev) => prev.filter((a) => a.file.name !== fileName));
  }

  function reset() {
    setAttachments([]);
    setUploadProgress(undefined);
  }

  // Helper function to get the first uploaded image URL
  function getUploadedImageUrl(): string | undefined {
    const uploadedAttachment = attachments.find(a => !a.isUploading && a.url);
    return uploadedAttachment?.url;
  }

  // Helper function to check if any uploads are complete
  function hasUploadedImages(): boolean {
    return attachments.some(a => !a.isUploading && a.url);
  }

  return {
    startUpload: handleStartUpload,
    attachments,
    isUploading,
    uploadProgress,
    removeAttachment,
    reset,
    getUploadedImageUrl,
    hasUploadedImages,
  };
}

interface StreamEvent {
  t: 'chunk' | 'done' | 'error'
  v?: string
  id?: string
  ts?: string
  e?: string
}

interface SendMessagePayload {
  conversationId: string
  content: string
}

interface StreamMessageCallbacks {
  onChunk: (chunk: string) => void
  onDone: (result: { id: string; createdAt: Date }) => void
  onError: (error: Error) => void
}

/**
 * Custom hook for sending a message to the AI endpoint and consuming the
 * Server-Sent Events (SSE) streaming response in real-time.
 *
 * Instead of using a TanStack mutation (which buffers the full response),
 * this hook reads the response body as a stream and fires callbacks on each
 * received chunk so the UI can display tokens as they arrive.
 */
export function useSendMessageToAI() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const sendMessage = async (
    payload: SendMessagePayload,
    callbacks: StreamMessageCallbacks,
  ) => {
    setIsPending(true)
    setError(null)

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send message')
      }

      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const jsonStr = line.slice(6).trim()
          if (!jsonStr) continue

          let event: StreamEvent
          try {
            event = JSON.parse(jsonStr) as StreamEvent
          } catch {
            // Ignore malformed SSE lines
            continue
          }

          if (event.t === 'chunk' && event.v !== undefined) {
            callbacks.onChunk(event.v)
          } else if (event.t === 'done' && event.id && event.ts) {
            callbacks.onDone({ id: event.id, createdAt: new Date(event.ts) })
          } else if (event.t === 'error') {
            throw new Error(event.e || 'Streaming error')
          }
        }
      }
    } catch (err) {
      const streamError = err instanceof Error ? err : new Error('Unknown error')
      setError(streamError)
      callbacks.onError(streamError)
    } finally {
      setIsPending(false)
    }
  }

  return { sendMessage, isPending, error }
}

export const useClearConversation = () =>
  useMutation<void, Error, { conversationId: string }>({
    mutationFn: async ({ conversationId }) => {
      const res = await fetch('/api/ai', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to clear conversation')
      }
    },
  })