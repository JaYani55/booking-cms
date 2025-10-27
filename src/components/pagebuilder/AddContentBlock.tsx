import React, { useState } from 'react';
import { ContentBlock } from '@/types/pagebuilder';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus } from 'lucide-react';

interface AddContentBlockProps {
  onAdd: (block: ContentBlock) => void;
  prefix: string;
}

export const AddContentBlock: React.FC<AddContentBlockProps> = ({ onAdd, prefix }) => {
  const generateBlockId = () => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const addTextBlock = () => {
    onAdd({
      id: generateBlockId(),
      type: 'text',
      content: '',
      format: 'paragraph',
    });
  };

  const addImageBlock = () => {
    onAdd({
      id: generateBlockId(),
      type: 'image',
      src: '',
      alt: '',
    });
  };

  const addQuoteBlock = () => {
    onAdd({
      id: generateBlockId(),
      type: 'quote',
      text: '',
    });
  };

  const addListBlock = () => {
    onAdd({
      id: generateBlockId(),
      type: 'list',
      style: 'unordered',
      items: [],
    });
  };

  const addVideoBlock = () => {
    onAdd({
      id: generateBlockId(),
      type: 'video',
      src: '',
      provider: 'youtube',
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Content Block
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={addTextBlock}>Text Block</DropdownMenuItem>
        <DropdownMenuItem onClick={addImageBlock}>Image Block</DropdownMenuItem>
        <DropdownMenuItem onClick={addQuoteBlock}>Quote Block</DropdownMenuItem>
        <DropdownMenuItem onClick={addListBlock}>List Block</DropdownMenuItem>
        <DropdownMenuItem onClick={addVideoBlock}>Video Block</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
