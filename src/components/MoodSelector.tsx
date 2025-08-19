interface MoodScale {
  name: string;
  mood: string;
  scale: string[];
  scale_degrees: number[];
  color: string;
  symbol: string;
  description: string;
}

interface MoodSelectorProps {
  currentMood: string;
  isPlaying: boolean;
  onMoodChange: (mood: string) => void;
  onPlayPause: (mood: string) => void;
}

export const musicalScales: MoodScale[] = [
  { name: "Pentatonic Major", mood: "clear watercolor tones", scale: ["C","D","E","G","A"], scale_degrees: [0,2,4,7,9], 
    color: 'from-lime-400 via-green-300 to-lime-600', symbol: '🎋', description: 'zen gardens' },
  { name: "Lydian", mood: "bright, floating", scale: ["C","D","E","F#","G","A","B"], scale_degrees: [0,2,4,6,7,9,11], 
    color: 'from-amber-400 via-yellow-300 to-amber-500', symbol: '✨', description: 'ethereal brightness' },
  { name: "Dorian", mood: "cool, cinematic", scale: ["C","D","Eb","F","G","A","Bb"], scale_degrees: [0,2,3,5,7,9,10], 
    color: 'from-blue-400 via-slate-300 to-blue-600', symbol: '🌙', description: 'midnight stories' },
  { name: "Aeolian", mood: "warm melancholy", scale: ["C","D","Eb","F","G","Ab","Bb"], scale_degrees: [0,2,3,5,7,8,10], 
    color: 'from-orange-400 via-red-300 to-orange-600', symbol: '🍃', description: 'autumn memories' },
  { name: "Mixolydian", mood: "bright but with soft tension", scale: ["C","D","E","F","G","A","Bb"], scale_degrees: [0,2,4,5,7,9,10], 
    color: 'from-emerald-400 via-teal-300 to-emerald-600', symbol: '🌊', description: 'ocean waves' },
  { name: "Phrygian", mood: "misty, exotic", scale: ["C","Db","Eb","F","G","Ab","Bb"], scale_degrees: [0,1,3,5,7,8,10], 
    color: 'from-purple-400 via-violet-300 to-purple-600', symbol: '🔮', description: 'mystic realms' },
  { name: "Whole Tone", mood: "floating weightlessness", scale: ["C","D","E","F#","G#","A#"], scale_degrees: [0,2,4,6,8,10], 
    color: 'from-cyan-400 via-sky-300 to-cyan-600', symbol: '☁️', description: 'dreamlike suspension' },
  { name: "Hirajoshi", mood: "glassy meditation", scale: ["C","Db","F","G","Ab"], scale_degrees: [0,1,5,7,8], 
    color: 'from-rose-400 via-pink-300 to-rose-600', symbol: '🌸', description: 'cherry blossoms' }
];

export const MoodSelector = ({ currentMood, isPlaying, onMoodChange, onPlayPause }: MoodSelectorProps) => {
  return (
    <div className="mb-8">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-medium mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Choose Your Mood
        </h3>
        <p className="text-sm text-muted-foreground">
          Same card: play/pause • Different card: next track
        </p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {musicalScales.map((scale) => (
          <div
            key={scale.name}
            className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-300 hover-scale ${
              currentMood === scale.name 
                ? 'scale-105 shadow-xl ring-2 ring-primary/50' 
                : 'hover:shadow-lg'
            }`}
            onClick={() => onPlayPause(scale.name)}
          >
            {/* Background gradient */}
            <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${scale.color} ${
              currentMood === scale.name ? 'opacity-30' : 'opacity-15 group-hover:opacity-25'
            } transition-all duration-300`} />
            
            {/* Content */}
            <div className="relative z-10 text-center space-y-2">
              <div className="text-2xl">{scale.symbol}</div>
              <div>
                <h4 className="font-semibold text-sm">{scale.name}</h4>
                <p className="text-xs text-muted-foreground">{scale.description}</p>
              </div>
            </div>
            
            {/* Active indicator */}
            {currentMood === scale.name && (
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};