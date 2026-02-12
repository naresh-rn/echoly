import React from 'react';
import { 
  Twitter, Linkedin, Mail, FileText, Instagram, Music, 
  Facebook, Youtube, MessageCircle, Pin, PenTool, Share2 
} from 'lucide-react';

export const PLATFORMS_CONFIG = [
  {
    id: 'linkedin',
    icon: <Linkedin size={18} />,
    color: "#0A66C2",
    shareUrl: (text) => `https://www.linkedin.com/sharing/share-offsite/?text=${encodeURIComponent(text)}`,
    prompt: `You are a high-authority LinkedIn Ghostwriter. Task: Transform content into a PAS (Problem-Agitate-Solution) post. Use a strong hook, bullet points, and 3-5 hashtags.`
  },
  {
    id: 'twitter',
    icon: <Twitter size={18} />,
    color: "#1DA1F2",
    shareUrl: (text) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
    prompt: `You are a viral X thread writer. Task: Create a 5-7 post thread. First tweet is a scroll-stopping hook. Short sentences.`
  },
  {
    id: 'instagram',
    icon: <Instagram size={18} />,
    color: "#E4405F",
    prompt: `You are an Instagram Strategist. Task: Create a feed caption and a 3-frame Story script. Use emojis and 10 hashtags.`
  },
  {
    id: 'tiktok',
    icon: <Music size={18} />,
    color: "#00f2ea",
    prompt: `You are a viral TikTok scriptwriter. Task: 30-60s script with a 3-second hook and scene segments in [brackets].`
  },
  {
    id: 'newsletter',
    icon: <Mail size={18} />,
    color: "#EA4335",
    prompt: `You are a Newsletter Editor. Task: Create an executive summary with a click-worthy subject line and 3-5 key takeaways.`
  },
  {
    id: 'blog',
    icon: <FileText size={18} />,
    color: "#10B981",
    prompt: `You are a SEO tech blogger. Task: 400-word draft with H1, intro, 3 H2 sub-headers, and conclusion.`
  },
  {
    id: 'threads',
    icon: <MessageCircle size={18} />,
    color: "#000000",
    prompt: `You are a conversational Threads influencer. Task: Create a 3-post series that feels informal and community-driven.`
  },
  {
    id: 'facebook',
    icon: <Facebook size={18} />,
    color: "#1877F2",
    prompt: `You are a Community Manager. Task: Create a long-form Facebook post designed for Group engagement.`
  },
  {
    id: 'pinterest',
    icon: <Pin size={18} />,
    color: "#BD081C",
    prompt: `You are a Pinterest SEO Expert. Task: Create a Pin Title and a keyword-rich description.`
  },
  {
    id: 'youtube',
    icon: <Youtube size={18} />,
    color: "#FF0000",
    prompt: `You are a YouTube Channel Manager. Task: Create a YouTube Community tab update including a poll prompt.`
  },
  {
    id: 'medium',
    icon: <PenTool size={18} />,
    color: "#000000",
    prompt: `You are a top Medium writer. Task: Write a 'Thought Leadership' article summary using a compelling personal narrative.`
  },
  {
    id: 'reddit',
    icon: <Share2 size={18} />,
    color: "#FF4500",
    prompt: `You are an expert Redditor. Task: Draft an authentic post for r/Technology. Avoid marketing fluff. Use raw Markdown.`
  },
  {
    id: 'youtube',
    icon: <Youtube size={18} />,
    color: "#FF0000",
    prompt: `You are a YouTube Channel Manager. 
            1. Create a YouTube Community tab update. 
            2. Create a high-CTR Thumbnail Concept.
            3. Provide a 'DALL-E Image Prompt' for the thumbnail background.`
    }
];