import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { PageBuilderData, ContentBlock } from '@/types/pagebuilder';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FeaturesFormProps {
  form: ReturnType<typeof useFormContext<PageBuilderData>>;
}

export const FeaturesForm: React.FC<FeaturesFormProps> = ({ form }) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'features',
  });

  const generateBlockId = (prefix: string) => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h2 className="text-2xl font-bold">Features Section</h2>
      {fields.map((field, index) => (
        <div key={field.id} className="space-y-2 p-4 border-b bg-muted/30 rounded">
          <div>
            <Label>Title</Label>
            <Input {...form.register(`features.${index}.title`)} />
          </div>
          
          <div>
            <Label>Description Blocks</Label>
            <FeatureDescriptionBlocks featureIndex={index} form={form} />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`features.${index}.reverse`}
              checked={form.watch(`features.${index}.reverse`) || false}
              onCheckedChange={(checked) =>
                form.setValue(`features.${index}.reverse`, checked as boolean)
              }
            />
            <Label htmlFor={`features.${index}.reverse`}>Reverse Layout</Label>
          </div>
          
          <Button type="button" variant="destructive" onClick={() => remove(index)}>
            Remove Feature
          </Button>
        </div>
      ))}
      <Button
        type="button"
        onClick={() =>
          append({
            title: '',
            description: [
              {
                id: generateBlockId('feature-desc'),
                type: 'text',
                content: '',
                format: 'paragraph',
              } as ContentBlock,
            ],
            reverse: false,
          })
        }
      >
        Add Feature
      </Button>
    </div>
  );
};

const FeatureDescriptionBlocks: React.FC<{ featureIndex: number; form: any }> = ({
  featureIndex,
  form,
}) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `features.${featureIndex}.description`,
  });

  const generateBlockId = (prefix: string) => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  return (
    <div className="space-y-2 ml-4">
      {fields.map((field, blockIndex) => {
        const block = form.watch(`features.${featureIndex}.description.${blockIndex}`) as ContentBlock;
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
                  <Textarea
                    {...form.register(`features.${featureIndex}.description.${blockIndex}.content`)}
                  />
                </div>
                <div>
                  <Label className="text-sm">Format</Label>
                  <Select
                    value={
                      form.watch(`features.${featureIndex}.description.${blockIndex}.format`) ||
                      'paragraph'
                    }
                    onValueChange={(value) =>
                      form.setValue(
                        `features.${featureIndex}.description.${blockIndex}.format`,
                        value as any
                      )
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
            id: generateBlockId(`feature${featureIndex}-block`),
            type: 'text',
            content: '',
            format: 'paragraph',
          } as ContentBlock)
        }
      >
        Add Description Block
      </Button>
    </div>
  );
};
