import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertScenarioSchema } from "@shared/schema";
import type { InsertScenario } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

export default function SetupForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<InsertScenario>({
    resolver: zodResolver(insertScenarioSchema),
    defaultValues: {
      purpose: "",
      characterProfile: "",
      topic: "",
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
        {/* Purpose Field */}
        <FormField
          control={form.control}
          name="purpose"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purpose</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Negotiation, Conflict Resolution, Performance Review"
                  {...field}
                  data-testid="input-purpose"
                />
              </FormControl>
              <FormDescription>
                What type of conversation are you practicing?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Character Profile */}
        <FormField
          control={form.control}
          name="characterProfile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Character Profile (Provide as much details as possible for optimum experience)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the personality, communication style, and traits of the person you'll be talking to..."
                  rows={3}
                  {...field}
                  data-testid="textarea-character-profile"
                />
              </FormControl>
              <FormDescription>
                How would you describe the person you need to have this conversation with?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Topic/Situation */}
        <FormField
          control={form.control}
          name="topic"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Topic & Situation (Provide as much details as possible for optimum experience)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the specific situation or topic you need to discuss..."
                  rows={3}
                  {...field}
                  data-testid="textarea-topic"
                />
              </FormControl>
              <FormDescription>
                What specific situation do you need to navigate?
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
