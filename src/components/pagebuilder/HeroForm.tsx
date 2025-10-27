import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { PageBuilderData, ContentBlock } from '@/types/pagebuilder';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HeroFormProps {
  form: ReturnType<typeof useFormContext<PageBuilderData>>;
}

export const HeroForm: React.FC<HeroFormProps> = ({ form }) => {
  const { fields: statsFields, append: appendStat, remove: removeStat } = useFieldArray({
    control: form.control,
    name: 'hero.stats',
  });

  const { fields: descFields, append: appendDesc, remove: removeDesc } = useFieldArray({
    control: form.control,
    name: 'hero.description',
  });

  const generateBlockId = (prefix: string) => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h2 className="text-2xl font-bold">Hero Section</h2>
      <div>
        <Label>Title</Label>
        <Input {...form.register('hero.title')} />
      </div>
      <div>
        <Label>Image URL</Label>
        <Input {...form.register('hero.image')} />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">Description Blocks</h3>
        {descFields.map((field, index) => {
          const block = form.watch(`hero.description.${index}`) as ContentBlock;
          return (
            <div key={field.id} className="space-y-2 p-3 border rounded mb-2">
              <div className="flex justify-between items-center">
                <Label>Block Type: {block.type}</Label>
                <Button type="button" variant="destructive" size="sm" onClick={() => removeDesc(index)}>
                  Remove
                </Button>
              </div>
              
              {block.type === 'text' && (
                <>
                  <div>
                    <Label>Content</Label>
                    <Textarea {...form.register(`hero.description.${index}.content`)} />
                  </div>
                  <div>
                    <Label>Format</Label>
                    <Select
                      value={form.watch(`hero.description.${index}.format`) || 'paragraph'}
                      onValueChange={(value) => form.setValue(`hero.description.${index}.format`, value as any)}
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
          onClick={() =>
            appendDesc({
              id: generateBlockId('hero-desc'),
              type: 'text',
              content: '',
              format: 'paragraph',
            } as ContentBlock)
          }
        >
          Add Text Block
        </Button>
      </div>

      <div>
        <h3 className="text-lg font-semibold">Stats</h3>
        {statsFields.map((field, index) => (
          <div key={field.id} className="flex items-center space-x-2 mb-2">
            <Input {...form.register(`hero.stats.${index}.label`)} placeholder="Label" />
            <Input {...form.register(`hero.stats.${index}.value`)} placeholder="Value" />
            <Button type="button" onClick={() => removeStat(index)}>Remove</Button>
          </div>
        ))}
        <Button type="button" onClick={() => appendStat({ label: '', value: '' })}>Add Stat</Button>
      </div>
    </div>
  );
};
