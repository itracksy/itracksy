import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { trpcClient } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import {
  Music,
  Play,
  ExternalLink,
  Search,
  Brain,
  Coffee,
  Zap,
  Waves,
  TreePine,
  Clock,
  Headphones,
  Radio,
  Piano,
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
  color: string;
}

const focusMusicData: MusicItem[] = [
  {
    id: "1",
    title: "Deep Focus - Lofi Hip Hop Study Mix",
    artist: "Lofi Study Beats",
    url: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
    duration: "3:00:00",
    genre: "Lo-Fi",
    description: "Perfect for deep work sessions",
    tags: ["study", "concentration", "ambient"],
    color: "from-purple-500 to-indigo-600",
  },
  {
    id: "2",
    title: "Ambient Study Music",
    artist: "Ambient Focus",
    url: "https://www.youtube.com/watch?v=2OEL4P1Rz04",
    duration: "3:00:00",
    genre: "Ambient",
    description: "Atmospheric sounds for focus",
    tags: ["ambient", "instrumental"],
    color: "from-cyan-500 to-blue-600",
  },
  {
    id: "3",
    title: "Classical for Studying",
    artist: "Classical Collection",
    url: "https://www.youtube.com/watch?v=BMuknRb7woc",
    duration: "1:35:55",
    genre: "Classical",
    description: "Bach, Mozart & Beethoven",
    tags: ["classical", "baroque"],
    color: "from-amber-500 to-orange-600",
  },
  {
    id: "4",
    title: "Rain Sounds for Focus",
    artist: "Nature Sounds",
    url: "https://www.youtube.com/watch?v=q76bMs-NwRk",
    duration: "10:00:00",
    genre: "Nature",
    description: "Gentle rain to mask noise",
    tags: ["nature", "rain"],
    color: "from-slate-500 to-slate-700",
  },
  {
    id: "5",
    title: "Binaural Beats 40Hz",
    artist: "Focus Enhancement",
    url: "https://www.youtube.com/watch?v=WPni755-Krg",
    duration: "1:00:00",
    genre: "Binaural",
    description: "Gamma waves for alertness",
    tags: ["binaural", "brain-training"],
    color: "from-violet-500 to-purple-700",
  },
];

const breakMusicData: MusicItem[] = [
  {
    id: "6",
    title: "Relaxing Piano",
    artist: "Peaceful Piano",
    url: "https://www.youtube.com/watch?v=lFcSrYw-ARY",
    duration: "1:30:00",
    genre: "Piano",
    description: "Soothing melodies for rest",
    tags: ["piano", "relaxing"],
    color: "from-rose-400 to-pink-600",
  },
  {
    id: "7",
    title: "Meditation & Stress Relief",
    artist: "Meditation Sounds",
    url: "https://www.youtube.com/watch?v=1ZYbU82GVz4",
    duration: "2:00:00",
    genre: "Meditation",
    description: "Calming sounds to unwind",
    tags: ["meditation", "calm"],
    color: "from-teal-400 to-emerald-600",
  },
  {
    id: "8",
    title: "Ocean Waves",
    artist: "Nature Sounds",
    url: "https://www.youtube.com/watch?v=V1bFr2SWP1I",
    duration: "8:00:00",
    genre: "Nature",
    description: "Peaceful ocean relaxation",
    tags: ["ocean", "waves"],
    color: "from-blue-400 to-cyan-600",
  },
  {
    id: "9",
    title: "Forest Ambience",
    artist: "Forest Sounds",
    url: "https://www.youtube.com/watch?v=xNN7iTA57jM",
    duration: "3:00:00",
    genre: "Nature",
    description: "Birds chirping in forest",
    tags: ["forest", "birds"],
    color: "from-green-500 to-emerald-700",
  },
];

const energizingMusicData: MusicItem[] = [
  {
    id: "10",
    title: "Upbeat Instrumental",
    artist: "Energy Boost",
    url: "https://www.youtube.com/watch?v=Tx1sqYc3qas",
    duration: "1:45:00",
    genre: "Electronic",
    description: "Energizing beats for motivation",
    tags: ["upbeat", "motivation"],
    color: "from-orange-500 to-red-600",
  },
  {
    id: "11",
    title: "Coffee Shop Jazz",
    artist: "Jazz Cafe",
    url: "https://www.youtube.com/watch?v=Dx5qFachd3A",
    duration: "2:15:00",
    genre: "Jazz",
    description: "Smooth jazz vibes",
    tags: ["jazz", "smooth"],
    color: "from-yellow-500 to-amber-600",
  },
];

type TabType = "focus" | "break" | "energize";

const tabs: { id: TabType; label: string; icon: typeof Brain; description: string }[] = [
  { id: "focus", label: "Focus", icon: Brain, description: "Deep work & concentration" },
  { id: "break", label: "Break", icon: Coffee, description: "Relaxation & recovery" },
  { id: "energize", label: "Energize", icon: Zap, description: "Motivation & energy" },
];

export default function MusicPage() {
  const [activeTab, setActiveTab] = useState<TabType>("focus");
  const [searchQuery, setSearchQuery] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
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

  const handlePlayMusic = async (item: MusicItem) => {
    setPlayingId(item.id);
    try {
      await trpcClient.utils.openExternalUrl.mutate({ url: item.url });
      toast({
        title: "Now Playing",
        description: item.title,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open music",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setPlayingId(null), 1000);
    }
  };

  const getGenreIcon = (genre: string) => {
    switch (genre.toLowerCase()) {
      case "nature":
        return TreePine;
      case "ambient":
      case "binaural":
        return Waves;
      case "piano":
        return Piano;
      case "jazz":
      case "electronic":
        return Radio;
      default:
        return Headphones;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600">
              <Headphones className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Focus Music</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400">
            Curated sounds to boost your productivity
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search music..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 rounded-xl border-slate-200 bg-white pl-11 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-xl px-4 py-3 transition-all",
                  isActive
                    ? "bg-slate-900 text-white shadow-lg dark:bg-white dark:text-slate-900"
                    : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Music Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMusic.map((item) => {
            const GenreIcon = getGenreIcon(item.genre);
            const isPlaying = playingId === item.id;

            return (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-md dark:bg-slate-800"
              >
                {/* Gradient Header */}
                <div className={cn("h-24 bg-gradient-to-br p-4", item.color)}>
                  <div className="flex items-start justify-between">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                      <GenreIcon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-black/20 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
                      <Clock className="h-3 w-3" />
                      {item.duration}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="mb-1 font-semibold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">{item.artist}</p>

                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePlayMusic(item)}
                      disabled={isPlaying}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all",
                        "bg-slate-900 text-white hover:bg-slate-800",
                        "dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100",
                        isPlaying && "opacity-50"
                      )}
                    >
                      <Play className={cn("h-4 w-4", isPlaying && "animate-pulse")} />
                      {isPlaying ? "Opening..." : "Play"}
                    </button>
                    <button
                      onClick={() => handlePlayMusic(item)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredMusic.length === 0 && (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
              <Music className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">No music found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Try different search terms</p>
          </div>
        )}

        {/* Footer hint */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Music opens in YouTube. For offline playback, try{" "}
            <button
              onClick={() =>
                trpcClient.utils.openExternalUrl.mutate({ url: "https://www.learnifytube.com/" })
              }
              className="text-purple-500 hover:underline"
            >
              LearnifyTube
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
