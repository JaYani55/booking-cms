import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { PageBuilderData, ContentBlock } from '@/types/pagebuilder';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FaqFormProps {
  form: ReturnType<typeof useFormContext<PageBuilderData>>;
}

export const FaqForm: React.FC<FaqFormProps> = ({ form }) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'faq',
  });

  const generateBlockId = (prefix: string) => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h2 className="text-2xl font-bold">FAQ Section</h2>
      {fields.map((field, index) => (
        <div key={field.id} className="space-y-2 p-4 border-b bg-muted/30 rounded">
          <div>
            <Label>Question</Label>
            <Input {...form.register(`faq.${index}.question`)} />
          </div>
          
          <div>
            <Label>Answer Blocks</Label>
            <FaqAnswerBlocks faqIndex={index} form={form} />
          </div>
          
          <Button type="button" variant="destructive" onClick={() => remove(index)}>
            Remove FAQ
          </Button>
        </div>
      ))}
      <Button
        type="button"
        onClick={() =>
          append({
            question: '',
            answer: [
              {
                id: generateBlockId('faq-answer'),
                type: 'text',
                content: '',
                format: 'paragraph',
              } as ContentBlock,
            ],
          })
        }
      >
        Add FAQ
      </Button>
    </div>
  );
};

const FaqAnswerBlocks: React.FC<{ faqIndex: number; form: any }> = ({ faqIndex, form }) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `faq.${faqIndex}.answer`,
  });

  const generateBlockId = (prefix: string) => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  return (
    <div className="space-y-2 ml-4">
      {fields.map((field, blockIndex) => {
        const block = form.watch(`faq.${faqIndex}.answer.${blockIndex}`) as ContentBlock;
        return (
          <div key={field.id} className="space-y-2 p-2 border rounded bg-background">
            <div className="flex justify-between items-center">
              <Label className="text-sm">Block Type: {block.type}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(blockIndex)}
              >
                Remove Block
              </Button>
            </div>

            {block.type === 'text' && (
              <>
                <div>
                  <Label className="text-sm">Content</Label>
                  <Textarea {...form.register(`faq.${faqIndex}.answer.${blockIndex}.content`)} />
                </div>
                <div>
                  <Label className="text-sm">Format</Label>
                  <Select
                    value={form.watch(`faq.${faqIndex}.answer.${blockIndex}.format`) || 'paragraph'}
                    onValueChange={(value) =>
                      form.setValue(`faq.${faqIndex}.answer.${blockIndex}.format`, value as any)
                    }
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
          </div>
        );
      })}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() =>
          append({
            id: generateBlockId(`faq${faqIndex}-block`),
            type: 'text',
            content: '',
            format: 'paragraph',
          } as ContentBlock)
        }
      >
        Add Answer Block
      </Button>
    </div>
  );
};
