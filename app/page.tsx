"use client";

import { Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  description: z.string().min(6, {
    message: "Description must be at least 6 characters.",
  }),
  duration: z.enum(["300", "600"], {
    required_error: "You need to select a duration.",
  }),
  email: z.string().email("This is not a valid email.").optional(),
});

export default function Home() {
  const [generating, setGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState("audio.mp3");
  const { toast } = useToast();
  const { setTheme } = useTheme();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      duration: "300",
      email: undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setGenerating(true);
    const body = { ...values, duration: Number(values.duration) };
    const url = process.env.NEXT_PUBLIC_WORKFLOW_ENDPOINT as string;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status == 403) {
        toast({
          variant: "destructive",
          title: "Limit reached",
          description: "Please try again later",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Failed to generate",
          description: "Please try again",
        });
      }
      setGenerating(false);
      return;
    }

    const data = await response.json();
    setAudioUrl(data.meditation);

    if (body.email) {
      toast({
        title: "Generating Meditation",
        description:
          "You'll receive the meditation audio in your inbox once it has finished generating",
      });
    }

    toast({
      title: "Meditation generated ✅",
      description: "Click play, relax, and enjoy!",
    });
    setGenerating(false);
  }

  return (
    <main className="min-h-screen flex flex-col w-full bg-background">
      <div className="text-right p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex flex-col flex-1">
        <div className="w-full md:w-1/2 m-auto space-y-6 px-4 md:px-0">
          <div className="text-center mb-8">
            <h2 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl ">
              Meditate GPT 🧘🏻
            </h2>
            <p>
              Powered by{" "}
              <a href="https://buildship.com/" target="_blank">
                BuildShip
              </a>
            </p>
          </div>
          <div>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="I'm feeling nostalgic, help me focus on the present and future"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Describe your meditation session
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Meditation duration</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex gap-8"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="300" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              5 minutes
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="600" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              10 minutes
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter your email to receive the meditation audio via
                        email once it&apos;s generated
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Button type="submit" disabled={generating}>
                      {generating && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {generating ? "Generating" : "Generate"}
                    </Button>
                  </div>
                  {!generating && (
                    <p className="text-sm text-muted-foreground">
                      Generate a meditation session complete with a relaxing
                      background, featuring gentle music, and guided breathing
                      exercises to help you achieve a state of deep relaxation
                      and mindfulness.
                    </p>
                  )}
                  {generating && (
                    <p className="text-sm">
                      Please be patient, this usually takes around 2-4 minutes.
                    </p>
                  )}
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
      <div className="border-t h-24 flex">
        <div className="m-auto w-full md:w-1/2 px-4 md:px-0">
          <audio controls src={audioUrl} className="w-full" key={audioUrl}>
            Your browser does not support the audio element.
          </audio>
        </div>
      </div>
    </main>
  );
}
