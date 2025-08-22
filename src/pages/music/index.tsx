import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { trpcClient } from "@/utils/trpc";
import {
  Music,
  Play,
  ExternalLink,
  Search,
  Brain,
  Coffee,
  Waves,
  TreePine,
  Volume2,
  Clock,
} from "lucide-react";

interface MusicItem {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration: string;
  genre: string;
  description: string;
  tags: string[];
}

const focusMusicData: MusicItem[] = [
  {
    id: "1",
    title: "Deep Focus - Lofi Hip Hop Study Mix",
    artist: "Lofi Study Beats",
    url: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
    duration: "3:00:00",
    genre: "Lo-Fi",
    description: "Perfect for deep work sessions with minimal distractions",
    tags: ["study", "concentration", "ambient"],
  },
  {
    id: "2",
    title: "Ambient Study Music - Focus Sounds",
    artist: "Ambient Focus",
    url: "https://www.youtube.com/watch?v=2OEL4P1Rz04",
    duration: "3:00:00",
    genre: "Ambient",
    description: "Atmospheric sounds designed to enhance concentration",
    tags: ["ambient", "instrumental", "productivity"],
  },
  {
    id: "3",
    title: "Classical Music for Studying",
    artist: "Classical Study Collection",
    url: "https://www.youtube.com/watch?v=BMuknRb7woc",
    duration: "1:35:55",
    genre: "Classical",
    description: "Bach, Mozart, and Beethoven for enhanced cognitive performance",
    tags: ["classical", "baroque", "focus"],
  },
  {
    id: "4",
    title: "Rain Sounds for Focus",
    artist: "Nature Sounds",
    url: "https://www.youtube.com/watch?v=q76bMs-NwRk",
    duration: "10:00:00",
    genre: "Nature",
    description: "Gentle rain sounds to mask distracting noise",
    tags: ["nature", "rain", "white-noise"],
  },
  {
    id: "5",
    title: "Binaural Beats for Focus",
    artist: "Focus Enhancement",
    url: "https://www.youtube.com/watch?v=WPni755-Krg",
    duration: "1:00:00",
    genre: "Binaural",
    description: "40Hz gamma waves to boost concentration and alertness",
    tags: ["binaural", "gamma-waves", "brain-training"],
  },
];

const breakMusicData: MusicItem[] = [
  {
    id: "6",
    title: "Relaxing Piano Music",
    artist: "Peaceful Piano",
    url: "https://www.youtube.com/watch?v=lFcSrYw-ARY",
    duration: "1:30:00",
    genre: "Piano",
    description: "Soothing piano melodies for mental reset",
    tags: ["piano", "relaxing", "peaceful"],
  },
  {
    id: "7",
    title: "Meditation Music - Stress Relief",
    artist: "Meditation Sounds",
    url: "https://www.youtube.com/watch?v=1ZYbU82GVz4",
    duration: "2:00:00",
    genre: "Meditation",
    description: "Calming sounds to reduce stress and anxiety",
    tags: ["meditation", "stress-relief", "calm"],
  },
  {
    id: "8",
    title: "Ocean Waves Relaxation",
    artist: "Nature Sounds",
    url: "https://www.youtube.com/watch?v=V1bFr2SWP1I",
    duration: "8:00:00",
    genre: "Nature",
    description: "Peaceful ocean waves for complete relaxation",
    tags: ["ocean", "waves", "nature"],
  },
  {
    id: "9",
    title: "Forest Sounds - Birds Chirping",
    artist: "Forest Ambience",
    url: "https://www.youtube.com/watch?v=xNN7iTA57jM",
    duration: "3:00:00",
    genre: "Nature",
    description: "Natural forest sounds with gentle bird songs",
    tags: ["forest", "birds", "nature"],
  },
];

const energizingMusicData: MusicItem[] = [
  {
    id: "10",
    title: "Upbeat Instrumental Mix",
    artist: "Energy Boost",
    url: "https://www.youtube.com/watch?v=Tx1sqYc3qas",
    duration: "1:45:00",
    genre: "Electronic",
    description: "Energizing instrumental beats for motivation",
    tags: ["upbeat", "motivation", "electronic"],
  },
  {
    id: "11",
    title: "Coffee Shop Jazz",
    artist: "Jazz Cafe",
    url: "https://www.youtube.com/watch?v=Dx5qFachd3A",
    duration: "2:15:00",
    genre: "Jazz",
    description: "Smooth jazz to energize your work environment",
    tags: ["jazz", "coffee-shop", "smooth"],
  },
];

export default function MusicPage() {
  const [activeTab, setActiveTab] = useState<"focus" | "break" | "energize">("focus");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getCurrentMusicData = () => {
    switch (activeTab) {
      case "focus":
        return focusMusicData;
      case "break":
        return breakMusicData;
      case "energize":
        return energizingMusicData;
      default:
        return focusMusicData;
    }
  };

  const filteredMusic = getCurrentMusicData().filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handlePlayMusic = async (url: string, title: string) => {
    setIsLoading(true);
    try {
      await trpcClient.utils.openExternalUrl.mutate({ url });
      toast({
        title: "Opening music",
        description: `Playing "${title}" in your browser`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open music. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case "focus":
        return <Brain className="h-4 w-4" />;
      case "break":
        return <Coffee className="h-4 w-4" />;
      case "energize":
        return <Volume2 className="h-4 w-4" />;
      default:
        return <Music className="h-4 w-4" />;
    }
  };

  const getGenreIcon = (genre: string) => {
    switch (genre.toLowerCase()) {
      case "nature":
        return <TreePine className="h-4 w-4" />;
      case "ambient":
      case "binaural":
        return <Waves className="h-4 w-4" />;
      default:
        return <Music className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="mb-6 flex items-center gap-3">
        <Music className="h-8 w-8 text-tracksy-gold" />
        <div>
          <h1 className="text-3xl font-bold text-tracksy-blue dark:text-white">Focus Music</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Curated music and sounds to enhance your productivity and focus
          </p>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="flex-1">
          <Label htmlFor="search" className="sr-only">
            Search music
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              id="search"
              placeholder="Search by title, artist, genre, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "focus" | "break" | "energize")}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="focus" className="flex items-center gap-2">
            {getTabIcon("focus")}
            Focus
          </TabsTrigger>
          <TabsTrigger value="break" className="flex items-center gap-2">
            {getTabIcon("break")}
            Break
          </TabsTrigger>
          <TabsTrigger value="energize" className="flex items-center gap-2">
            {getTabIcon("energize")}
            Energize
          </TabsTrigger>
        </TabsList>

        <TabsContent value="focus" className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMusic.map((item) => (
              <MusicCard
                key={item.id}
                item={item}
                onPlay={() => handlePlayMusic(item.url, item.title)}
                isLoading={isLoading}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="break" className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMusic.map((item) => (
              <MusicCard
                key={item.id}
                item={item}
                onPlay={() => handlePlayMusic(item.url, item.title)}
                isLoading={isLoading}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="energize" className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMusic.map((item) => (
              <MusicCard
                key={item.id}
                item={item}
                onPlay={() => handlePlayMusic(item.url, item.title)}
                isLoading={isLoading}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {filteredMusic.length === 0 && (
        <div className="py-12 text-center">
          <Music className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-600 dark:text-gray-300">
            No music found
          </h3>
          <p className="text-gray-500">
            Try adjusting your search terms or browse different categories
          </p>
        </div>
      )}
    </div>
  );
}

interface MusicCardProps {
  item: MusicItem;
  onPlay: () => void;
  isLoading: boolean;
}

function MusicCard({ item, onPlay, isLoading }: MusicCardProps) {
  const getGenreIcon = (genre: string) => {
    switch (genre.toLowerCase()) {
      case "nature":
        return <TreePine className="h-4 w-4" />;
      case "ambient":
      case "binaural":
        return <Waves className="h-4 w-4" />;
      default:
        return <Music className="h-4 w-4" />;
    }
  };

  return (
    <Card className="transition-all duration-200 hover:border-tracksy-gold/30 hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getGenreIcon(item.genre)}
            <Badge variant="secondary" className="text-xs">
              {item.genre}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            {item.duration}
          </div>
        </div>
        <CardTitle className="text-lg leading-tight">{item.title}</CardTitle>
        <CardDescription className="text-sm">{item.artist}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{item.description}</p>

        <div className="flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onPlay}
            disabled={isLoading}
            className="flex-1 bg-tracksy-gold text-white hover:bg-tracksy-gold/90"
            size="sm"
          >
            <Play className="mr-2 h-4 w-4" />
            Play
          </Button>
          <Button variant="outline" size="sm" onClick={onPlay} disabled={isLoading}>
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
