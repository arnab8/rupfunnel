import React from 'react';
import { Play } from 'lucide-react';

interface VideoThumbnailProps {
  onClick: () => void;
  thumbnailUrl?: string;
}

const VideoThumbnail: React.FC<VideoThumbnailProps> = ({ onClick, thumbnailUrl }) => {
  return (
    <div 
      className="video-thumbnail aspect-video bg-gradient-to-br from-yellow-300 to-yellow-400 cursor-pointer group"
      onClick={onClick}
    >
      {thumbnailUrl ? (
        <img 
          src={thumbnailUrl} 
          alt="Video thumbnail" 
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center relative">
          {/* CEO Logo placeholder */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">1</span>
            </div>
            <div className="text-primary">
              <span className="text-xs font-medium">THE FIRST TIME</span>
              <span className="text-xl font-bold block -mt-1">CEO</span>
            </div>
          </div>

          {/* Text overlay */}
          <div className="text-center px-4">
            <p className="text-sm text-primary/70 mb-2">You're Right Here</p>
            <div className="w-24 h-0.5 bg-primary/30 mx-auto mb-4 relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-primary/50 rotate-45"></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Play button */}
      <div className="play-button group-hover:scale-110">
        <Play className="w-6 h-6 text-white ml-1" fill="white" />
      </div>
    </div>
  );
};

export default VideoThumbnail;
