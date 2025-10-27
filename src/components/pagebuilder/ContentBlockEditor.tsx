import React from 'react';
import { ContentBlock } from '@/types/pagebuilder';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ContentBlockEditorProps {
  block: ContentBlock;
  path: string;
  onRemove: () => void;
  form: any;
}

export const ContentBlockEditor: React.FC<ContentBlockEditorProps> = ({
  block,
  path,
  onRemove,
  form,
}) => {
  return (
    <div className="space-y-2 p-2 border rounded bg-background">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-semibold">Block Type: {block.type}</Label>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          Remove Block
        </Button>
      </div>

      {block.type === 'text' && (
        <>
          <div>
            <Label className="text-sm">Content</Label>
            <Textarea {...form.register(`${path}.content`)} rows={4} />
          </div>
          <div>
            <Label className="text-sm">Format</Label>
            <Select
              value={form.watch(`${path}.format`) || 'paragraph'}
              onValueChange={(value) => form.setValue(`${path}.format`, value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paragraph">Paragraph</SelectItem>
                <SelectItem value="heading1">Heading 1</SelectItem>
                <SelectItem value="heading2">Heading 2</SelectItem>
                <SelectItem value="heading3">Heading 3</SelectItem>
                <SelectItem value="bold">Bold</SelectItem>
                <SelectItem value="italic">Italic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {block.type === 'image' && (
        <>
          <div>
            <Label className="text-sm">Image Source URL</Label>
            <Input {...form.register(`${path}.src`)} placeholder="https://..." />
          </div>
          <div>
            <Label className="text-sm">Alt Text</Label>
            <Input {...form.register(`${path}.alt`)} placeholder="Description for accessibility" />
          </div>
          <div>
            <Label className="text-sm">Caption (Optional)</Label>
            <Input {...form.register(`${path}.caption`)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-sm">Width (Optional)</Label>
              <Input
                type="number"
                {...form.register(`${path}.width`, { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label className="text-sm">Height (Optional)</Label>
              <Input
                type="number"
                {...form.register(`${path}.height`, { valueAsNumber: true })}
              />
            </div>
          </div>
        </>
      )}

      {block.type === 'quote' && (
        <>
          <div>
            <Label className="text-sm">Quote Text</Label>
            <Textarea {...form.register(`${path}.text`)} rows={3} />
          </div>
          <div>
            <Label className="text-sm">Author (Optional)</Label>
            <Input {...form.register(`${path}.author`)} />
          </div>
          <div>
            <Label className="text-sm">Source (Optional)</Label>
            <Input {...form.register(`${path}.source`)} />
          </div>
        </>
      )}

      {block.type === 'list' && (
        <>
          <div>
            <Label className="text-sm">List Style</Label>
            <Select
              value={form.watch(`${path}.style`) || 'unordered'}
              onValueChange={(value) => form.setValue(`${path}.style`, value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ordered">Ordered (1, 2, 3...)</SelectItem>
                <SelectItem value="unordered">Unordered (bullets)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm">List Items (one per line)</Label>
            <Textarea
              {...form.register(`${path}.items`)}
              rows={5}
              placeholder="Item 1&#10;Item 2&#10;Item 3"
              onChange={(e) => {
                const items = e.target.value.split('\n').filter((item) => item.trim());
                form.setValue(`${path}.items`, items);
              }}
            />
          </div>
        </>
      )}

      {block.type === 'video' && (
        <>
          <div>
            <Label className="text-sm">Video URL</Label>
            <Input {...form.register(`${path}.src`)} placeholder="YouTube or Vimeo embed URL" />
          </div>
          <div>
            <Label className="text-sm">Provider</Label>
            <Select
              value={form.watch(`${path}.provider`) || 'youtube'}
              onValueChange={(value) => form.setValue(`${path}.provider`, value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="vimeo">Vimeo</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm">Caption (Optional)</Label>
            <Input {...form.register(`${path}.caption`)} />
          </div>
        </>
      )}
    </div>
  );
};
