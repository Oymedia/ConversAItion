import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertScenarioSchema } from "@shared/schema";
import type { InsertScenario } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
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

const CHARACTER_TRAITS = [
  "Short-tempered", "Cunning", "Obedient", "Nice", "Patient", "Aggressive",
  "Empathetic", "Analytical", "Creative", "Stubborn", "Flexible", "Confident",
  "Insecure", "Arrogant", "Humble", "Optimistic", "Pessimistic", "Rational",
  "Emotional", "Direct", "Indirect", "Assertive", "Passive", "Diplomatic",
  "Blunt", "Supportive", "Critical", "Open-minded", "Close-minded", "Enthusiastic",
  "Reserved", "Friendly", "Cold", "Competitive", "Cooperative"
] as const;

export default function SetupForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Extended schema with required field validation and custom error messages
  const requiredScenarioSchema = insertScenarioSchema.extend({
    purpose: z.string().min(1, "Please select a conversation type"),
    characterProfile: z.array(z.string()).min(1, "Please select at least one character trait"),
    coreIssue: z.string().min(1, "Please explain the core issue"),
    userStance: z.string().min(1, "Please describe your stance"),
    otherStance: z.string().min(1, "Please describe the other person's stance"),
    relationship: z.string().min(1, "Please describe your relationship with this person"),
    backgroundStory: z.string().optional(),
    goal: z.string().min(1, "Please specify what you want to achieve"),
  });

  const form = useForm<InsertScenario>({
    resolver: zodResolver(requiredScenarioSchema),
    defaultValues: {
      purpose: "",
      characterProfile: [],
      coreIssue: "",
      userStance: "",
      otherStance: "",
      relationship: "",
      backgroundStory: "",
      goal: "",
    },
  });

  const createScenarioMutation = useMutation({
    mutationFn: async (data: InsertScenario) => {
      const response = await apiRequest("POST", "/api/scenarios", data);
      return response.json();
    },
    onSuccess: async (scenario) => {
      // Start conversation for this scenario
      const response = await apiRequest("POST", `/api/scenarios/${scenario.id}/conversations`);
      const conversationData = await response.json();
      setLocation(`/conversation/${conversationData.conversation.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create scenario. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertScenario) => {
    createScenarioMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-scenario-setup">
        {/* Conversation Type Dropdown */}
        <FormField
          control={form.control}
          name="purpose"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What type of conversation is this?</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-purpose" className="bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder="Select conversation type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600">
                  <SelectItem value="Negotiation">Negotiation</SelectItem>
                  <SelectItem value="Conflict resolution">Conflict resolution</SelectItem>
                  <SelectItem value="Pitching to a customer">Pitching to a customer</SelectItem>
                  <SelectItem value="Proposal">Proposal</SelectItem>
                  <SelectItem value="Relationship Management">Relationship Management</SelectItem>
                  <SelectItem value="Feedback">Feedback</SelectItem>
                  <SelectItem value="Press Release">Press Release</SelectItem>
                  <SelectItem value="Critique/Review">Critique/Review</SelectItem>
                  <SelectItem value="Crisis Management">Crisis Management</SelectItem>
                  <SelectItem value="Discovery">Discovery</SelectItem>
                  <SelectItem value="Interrogation/Audit">Interrogation/Audit</SelectItem>
                  <SelectItem value="Arbitration">Arbitration</SelectItem>
                  <SelectItem value="Debate">Debate</SelectItem>
                  <SelectItem value="Mandate">Mandate</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Select the type of conversation you're practicing
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Relationship */}
        <FormField
          control={form.control}
          name="relationship"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What is your relationship with conversing person?</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your relationship (e.g., colleague, manager, client, friend, family member)..."
                  rows={2}
                  {...field}
                  data-testid="textarea-relationship"
                />
              </FormControl>
              <FormDescription>
                How would you describe your relationship with this person?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Character Profile - Checkboxes */}
        <FormField
          control={form.control}
          name="characterProfile"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel>Character Profile</FormLabel>
                <FormDescription>
                  Select the traits that describe the person you'll be talking to
                </FormDescription>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3" data-testid="checkbox-group-character-profile">
                {CHARACTER_TRAITS.map((trait) => (
                  <FormField
                    key={trait}
                    control={form.control}
                    name="characterProfile"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={trait}
                          className="flex flex-row items-start space-x-2 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              data-testid={`checkbox-trait-${trait.toLowerCase().replace(/\s+/g, '-')}`}
                              checked={field.value?.includes(trait)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, trait])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== trait
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal cursor-pointer">
                            {trait}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Core Issue */}
        <FormField
          control={form.control}
          name="coreIssue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Explain the core issue in the conversation</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the main problem or topic that needs to be addressed..."
                  rows={3}
                  {...field}
                  data-testid="textarea-core-issue"
                />
              </FormControl>
              <FormDescription>
                What is the central issue or topic of this conversation?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* User Stance */}
        <FormField
          control={form.control}
          name="userStance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What is your stance on the topic?</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your position, opinion, or perspective on this issue..."
                  rows={2}
                  {...field}
                  data-testid="textarea-user-stance"
                />
              </FormControl>
              <FormDescription>
                What is your perspective or position on this issue?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Other Person's Stance */}
        <FormField
          control={form.control}
          name="otherStance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What is the conversing person's stance on the topic?</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the other person's position, opinion, or perspective..."
                  rows={2}
                  {...field}
                  data-testid="textarea-other-stance"
                />
              </FormControl>
              <FormDescription>
                What is the other person's perspective or position?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Background Story (Optional) */}
        <FormField
          control={form.control}
          name="backgroundStory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Background story to the conversation (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any relevant history or context leading up to this conversation..."
                  rows={3}
                  {...field}
                  value={field.value || ""}
                  data-testid="textarea-background-story"
                />
              </FormControl>
              <FormDescription>
                Provide any relevant background or history if applicable
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* End Goal */}
        <FormField
          control={form.control}
          name="goal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Goal</FormLabel>
              <FormControl>
                <Input
                  placeholder="What outcome are you hoping to achieve?"
                  {...field}
                  data-testid="input-goal"
                />
              </FormControl>
              <FormDescription>
                What specific outcome do you want from this conversation?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full"
          disabled={createScenarioMutation.isPending}
          data-testid="button-start-simulation"
        >
          {createScenarioMutation.isPending ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Creating Simulation...
            </>
          ) : (
            <>
              <i className="fas fa-play mr-2"></i>
              Start Simulation
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
