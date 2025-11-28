"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Save, Sparkles } from "lucide-react";
import {
  newAttributeFormSchema,
  type NewAttributeFormValues,
} from "../utils/attribute-schema";
import {
  ATTRIBUTE_TYPE_OPTIONS,
  DEFAULT_MULTIPLE_CHOICE_OPTIONS,
} from "../constants/attribute";
import type { AttributeType } from "../types/attribute";

interface AddAttributeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: NewAttributeFormValues) => void;
  isLoading?: boolean;
}

export function AddAttributeDialog({
  open,
  onOpenChange,
  onSave,
  isLoading = false,
}: AddAttributeDialogProps) {
  const [customOptions, setCustomOptions] = useState<string[]>([
    ...DEFAULT_MULTIPLE_CHOICE_OPTIONS,
  ]);
  const [newOption, setNewOption] = useState("");

  const form = useForm<NewAttributeFormValues>({
    resolver: zodResolver(newAttributeFormSchema),
    defaultValues: {
      name: "",
      type: "text",
      description: "",
      required: false,
      options: DEFAULT_MULTIPLE_CHOICE_OPTIONS,
    },
  });

  const { watch, setValue, reset } = form;
  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedType = watch("type");

  const handleClose = () => {
    reset();
    setCustomOptions([...DEFAULT_MULTIPLE_CHOICE_OPTIONS]);
    setNewOption("");
    onOpenChange(false);
  };

  const handleAddOption = () => {
    if (newOption.trim() && !customOptions.includes(newOption.trim())) {
      const updatedOptions = [...customOptions, newOption.trim()];
      setCustomOptions(updatedOptions);
      setValue("options", updatedOptions);
      setNewOption("");
    }
  };

  const handleRemoveOption = (index: number) => {
    const updatedOptions = customOptions.filter((_, i) => i !== index);
    setCustomOptions(updatedOptions);
    setValue("options", updatedOptions);
  };

  const handleTypeChange = (type: AttributeType) => {
    setValue("type", type);
    if (type === "multiple_choice") {
      setValue("options", customOptions);
    } else {
      setValue("options", undefined);
    }
  };

  const handleSubmit = async (data: NewAttributeFormValues) => {
    try {
      onSave(data);
      handleClose();
    } catch (error) {
      console.error("Error creating attribute:", error);
      toast.error("Failed to create attribute. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="bg-primary/10 rounded-lg p-2">
              <Sparkles className="text-primary h-5 w-5" />
            </div>
            <span>Create Custom Attribute</span>
          </DialogTitle>
          <DialogDescription>
            Define a new custom attribute to collect additional subscriber data.
            This will help you create more targeted segments.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Basic Information */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Attribute Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Company Size, Industry, Job Title"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Use a clear, descriptive name for your attribute
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Attribute Type</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleTypeChange(value as AttributeType);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select attribute type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ATTRIBUTE_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose the data type for this attribute
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain what this attribute represents..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Help your team understand this attribute
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="required"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Required</FormLabel>
                      <FormDescription>
                        Make this attribute mandatory for all subscribers
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Multiple Choice Options */}
            {selectedType === "multiple_choice" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel>Options</FormLabel>
                  <div className="text-muted-foreground text-sm">
                    {customOptions.length} option
                    {customOptions.length !== 1 ? "s" : ""}
                  </div>
                </div>

                <div className="space-y-3">
                  {customOptions.map((option, index) => (
                    <div
                      key={index}
                      className="bg-muted/30 flex items-center space-x-2 rounded-lg border p-3"
                    >
                      <Badge variant="secondary" className="text-xs">
                        {index + 1}
                      </Badge>
                      <span className="flex-1 text-sm">{option}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveOption(index)}
                        className="text-muted-foreground hover:text-destructive h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-2">
                  <Input
                    placeholder="Add new option..."
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddOption();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddOption}
                    disabled={!newOption.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <FormDescription>
                  Add at least 2 options for multiple choice attributes
                </FormDescription>
              </div>
            )}

            <DialogFooter className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "Creating..." : "Create Attribute"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
