'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Copy, Check, Image as ImageIcon, Paperclip, Newspaper, Search, Zap, Brain, Download, Pin, Settings } from 'lucide-react';
import { personalities } from '@/lib/ai/personalities';
import { supabaseAdmin } from '@/lib/supabase/client';
import { parseMarkdown } from '@/lib/utils/markdown-parser';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  thinking?: string;
  referencedStory?: { id: string; title: string; image?: string; url: string };
}

interface AttachedStory {
  id: string;
  title: string;
  image?: string;
}

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showStoryPicker, setShowStoryPicker] = useState(false);
  const [storySearch, setStorySearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [attachedStory, setAttachedStory] = useState<AttachedStory | null>(null);
  const [thinkingText, setThinkingText] = useState('');
  const [deepThinking, setDeepThinking] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [pinnedStory, setPinnedStory] = useState<{ id: string; title: string; image?: string; url: string; isPinned?: boolean } | null>(null);
  const [storyHistory, setStoryHistory] = useState<Array<{ id: string; title: string; image?: string; messageId: string }>>([]);
  const [personality, setPersonality] = useState('professional');
  const [showPersonalityMenu, setShowPersonalityMenu] = useState(false);
  const [customPersonality, setCustomPersonality] = useState({ name: '', prompt: '' });
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showPersonalitySwitch, setShowPersonalitySwitch] = useState(false);
  const [expandedThinking, setExpandedThinking] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [userScrolled, setUserScrolled] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (!userScrolled) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, thinkingText]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 50;
    setUserScrolled(!isAtBottom);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const searchStories = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const { data } = await supabaseAdmin
      .from('stories_raw')
      .select('id, title, metadata, url')
      .ilike('title', `%${query}%`)
      .order('published_at', { ascending: false })
      .limit(10);

    setSearchResults(data || []);
  };

  useEffect(() => {
    const timer = setTimeout(() => searchStories(storySearch), 300);
    return () => clearTimeout(timer);
  }, [storySearch]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportAsMarkdown = () => {
    const markdown = `# Source-News Chat Export\n\nExported: ${new Date().toLocaleString()}\n\n---\n\n${messages.map(m => `## ${m.role === 'user' ? 'You' : 'Assistant'}\n\n${m.content}\n\n${m.thinking ? `**Thinking Process:**\n${m.thinking}\n\n` : ''}---\n`).join('\n')}`;
    
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `source-news-chat-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const exportAsJSON = () => {
    const json = JSON.stringify({
      exported: new Date().toISOString(),
      platform: 'Source-News',
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        thinking: m.thinking,
      })),
    }, null, 2);
    
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `source-news-chat-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const sendMessage = async () => {
    if (!input.trim() && !attachedStory) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: attachedStory 
        ? `[Story: ${attachedStory.title}]\n\n${input}`
        : input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    const currentAttachedStory = attachedStory;
    setAttachedStory(null);
    setIsTyping(true);
    setThinkingText('Analyzing your question...');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage.content, 
          history: messages,
          storyId: currentAttachedStory?.id,
          deepThinking,
          personality,
          customPersonality: personality === 'custom' ? customPersonality : undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setThinkingText('');
        setIsTyping(false);
        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: errorData.response || 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        }]);
        return;
      }

      const data = await response.json();

      setThinkingText('');
      
      const assistantMessageId = (Date.now() + 1).toString();
      const fullResponse = data.response || 'No response received';
      
      setMessages((prev) => [...prev, {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        thinking: data.thinking,
        referencedStory: data.referencedStory,
      }]);

      let currentIndex = 0;
      const typingSpeed = deepThinking ? 10 : 15;
      
      const typeWriter = () => {
        if (currentIndex < fullResponse.length) {
          const chunkSize = deepThinking ? 5 : 3;
          const chunk = fullResponse.slice(currentIndex, currentIndex + chunkSize);
          currentIndex += chunkSize;
          
          setMessages((prev) => 
            prev.map((m) => 
              m.id === assistantMessageId
                ? { ...m, content: fullResponse.slice(0, currentIndex) }
                : m
            )
          );
          
          setTimeout(typeWriter, typingSpeed);
        } else {
          setIsTyping(false);
        }
      };
      
      typeWriter();

      if (data.referencedStory) {
        if (!pinnedStory || !pinnedStory.isPinned) {
          setPinnedStory({ ...data.referencedStory, isPinned: false });
        }
        setStoryHistory(prev => [
          ...prev.filter(s => s.id !== data.referencedStory.id),
          { ...data.referencedStory, messageId: assistantMessageId }
        ]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setThinkingText('');
      setIsTyping(false);
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }]);
    }
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 shadow-lg flex items-center justify-center border-4 border-gray-900"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          boxShadow: [
            '0 0 20px rgba(55, 65, 81, 0.3)',
            '0 0 40px rgba(55, 65, 81, 0.5)',
            '0 0 20px rgba(55, 65, 81, 0.3)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Sparkles className="w-7 h-7 text-white" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 z-50"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-6 top-6 bottom-6 w-full sm:w-[400px] bg-gray-50 dark:bg-gray-900 border-4 border-gray-800 rounded-[3rem] z-50 flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="relative p-4 pt-8 border-b-4 border-gray-700 bg-gradient-to-r from-gray-700 to-gray-800 rounded-t-[2.5rem]">
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-white/30 rounded-full"
                      animate={{
                        y: [0, -100],
                        x: [0, Math.random() * 50 - 25],
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: i * 0.6,
                      }}
                      style={{
                        left: `${20 + i * 15}%`,
                        bottom: 0,
                      }}
                    />
                  ))}
                </div>

                <div className="relative flex items-center gap-3">
                  <motion.div
                    className="relative w-12 h-12"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <motion.div
                      className="absolute inset-0 rounded-full bg-white/20"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0, 0.5],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <div className="relative w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-gray-800 text-lg border-2 border-gray-900">
                      SN
                    </div>
                    <motion.div
                      className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-700"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </motion.div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-white">Source AI</h3>
                    <p className="text-xs text-white/80">AI News Analyst</p>
                  </div>

                  <div className="flex gap-2 items-center">
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowPersonalityMenu(!showPersonalityMenu);
                        }}
                        className="text-white/80 hover:text-white transition-colors p-1"
                        title="Change personality"
                      >
                        <span className="text-xl">{personalities[personality]?.icon || '🎯'}</span>
                      </button>
                      
                      {showPersonalityMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-10 right-0 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-[100] w-56"
                        >
                          {Object.values(personalities).map((p) => (
                            <button
                              key={p.id}
                              onClick={() => {
                                setPersonality(p.id);
                                setShowPersonalityMenu(false);
                                setShowPersonalitySwitch(true);
                                setTimeout(() => setShowPersonalitySwitch(false), 3000);
                              }}
                              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 ${personality === p.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                            >
                              <span>{p.icon}</span>
                              <div>
                                <div className="font-medium">{p.name}</div>
                                <div className="text-xs text-gray-500">{p.description}</div>
                              </div>
                            </button>
                          ))}
                          <button
                            onClick={() => {
                              setShowCustomModal(true);
                              setShowPersonalityMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-t border-gray-200 dark:border-gray-600 flex items-center gap-2"
                          >
                            <Settings className="w-4 h-4" />
                            <div>
                              <div className="font-medium">Custom</div>
                              <div className="text-xs text-gray-500">Create your own</div>
                            </div>
                          </button>
                        </motion.div>
                      )}
                    </div>

                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowExportMenu(!showExportMenu);
                        }}
                        className="text-white/80 hover:text-white transition-colors p-1"
                        title="Export chat"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    
                    {showExportMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-10 right-0 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-[100] min-w-[180px]"
                      >
                        <button
                          onClick={exportAsMarkdown}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          Export as Markdown
                        </button>
                        <button
                          onClick={exportAsJSON}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-t border-gray-200 dark:border-gray-600"
                        >
                          Export as JSON
                        </button>
                      </motion.div>
                    )}
                    </div>
                  </div>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {attachedStory && (
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border-b-2 border-purple-300 dark:border-purple-700">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-xs font-semibold text-purple-600">📎 Attached Story</div>
                    <button onClick={() => setAttachedStory(null)} className="ml-auto text-gray-500 hover:text-gray-700">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex gap-2 items-center">
                    {attachedStory.image && <img src={attachedStory.image} alt="" className="w-12 h-12 object-cover rounded" />}
                    <p className="text-xs font-medium line-clamp-2 flex-1">{attachedStory.title}</p>
                  </div>
                </div>
              )}

              {pinnedStory && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-300 dark:border-blue-700">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-xs font-semibold text-blue-600">
                      {pinnedStory.isPinned ? '📌 Pinned Story' : '🔄 Auto-Pinned'}
                    </div>
                    <button 
                      onClick={() => setPinnedStory(prev => prev ? { ...prev, isPinned: !prev.isPinned } : null)}
                      className="text-gray-500 hover:text-blue-600"
                      title={pinnedStory.isPinned ? 'Unpin' : 'Pin story'}
                    >
                      <Pin className={`w-3 h-3 ${pinnedStory.isPinned ? 'fill-blue-600' : ''}`} />
                    </button>
                    <button onClick={() => setPinnedStory(null)} className="ml-auto text-gray-500 hover:text-gray-700">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <a href={pinnedStory.url} target="_blank" rel="noopener noreferrer" className="flex gap-2 items-center">
                    {pinnedStory.image && <img src={pinnedStory.image} alt="" className="w-12 h-12 object-cover rounded" />}
                    <p className="text-xs font-medium line-clamp-2 flex-1">{pinnedStory.title}</p>
                  </a>
                  {storyHistory.length > 1 && (
                    <div className="mt-2 flex gap-1 overflow-x-auto">
                      {storyHistory.slice(-5).map((story) => (
                        <button
                          key={story.id}
                          onClick={() => {
                            const foundStory = searchResults.find(s => s.id === story.id);
                            setPinnedStory({ 
                              id: story.id, 
                              title: story.title, 
                              image: story.image, 
                              url: foundStory?.url || '', 
                              isPinned: false 
                            });
                          }}
                          className={`flex-shrink-0 w-8 h-8 rounded border-2 overflow-hidden ${story.id === pinnedStory.id ? 'border-blue-600' : 'border-gray-300 opacity-50'}`}
                        >
                          {story.image && <img src={story.image} alt="" className="w-full h-full object-cover" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {showPersonalitySwitch && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-2 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 border-b border-purple-300 dark:border-purple-700 text-center"
                >
                  <p className="text-xs font-medium text-purple-700 dark:text-purple-300">
                    {personalities[personality]?.icon} Switched to {personalities[personality]?.name} mode
                  </p>
                </motion.div>
              )}

              <div 
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-4" 
                style={{ overscrollBehavior: 'contain' }}
              >
                {messages.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-gray-500 dark:text-gray-400 mt-8"
                  >
                    <Sparkles className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                    <p className="text-sm">Ask me about any news story</p>
                  </motion.div>
                )}

                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] ${message.role === 'user' ? '' : 'space-y-2'}`}>
                      {message.thinking && (
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-xs text-gray-600 dark:text-gray-400 border-l-2 border-blue-500">
                          <button
                            onClick={() => setExpandedThinking(expandedThinking === message.id ? null : message.id)}
                            className="w-full flex items-center justify-between hover:bg-gray-200 dark:hover:bg-gray-700 p-1 rounded transition-colors"
                          >
                            <div className="font-semibold">Thinking Process</div>
                            <span className="text-xs">{expandedThinking === message.id ? '▼' : '▶'}</span>
                          </button>
                          <AnimatePresence>
                            {expandedThinking === message.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600 whitespace-pre-wrap"
                              >
                                {message.thinking}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                      
                      <div className="relative group">
                        <div
                          className={`rounded-2xl px-4 py-3 border-2 ${
                            message.role === 'user'
                              ? 'bg-gray-700 text-white border-gray-800'
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 shadow-sm'
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.role === 'assistant' ? parseMarkdown(message.content) : message.content}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => copyToClipboard(message.content, message.id)}
                          className={`absolute top-2 ${message.role === 'user' ? 'left-2' : 'right-2'} opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${
                            message.role === 'user' ? 'bg-gray-800' : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        >
                          {copiedId === message.id ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>

                      {message.referencedStory && (
                        <div className="relative">
                          <a
                            href={message.referencedStory.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex gap-2 p-2 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 rounded-lg hover:border-blue-500 transition-colors mt-2"
                          >
                            {message.referencedStory.image && (
                              <img src={message.referencedStory.image} alt="" className="w-16 h-16 object-cover rounded" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium line-clamp-2">{message.referencedStory.title}</p>
                            </div>
                          </a>
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-gray-900 cursor-help" title="Referenced source">
                            1
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {thinkingText && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-xs text-gray-600 dark:text-gray-400 border-l-2 border-blue-500 max-w-[85%]">
                      <div className="font-semibold mb-1">Thinking...</div>
                      {thinkingText}
                    </div>
                  </motion.div>
                )}

                {isTyping && !thinkingText && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 border-2 border-gray-300 dark:border-gray-700">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 bg-gray-400 rounded-full"
                            animate={{ y: [0, -8, 0] }}
                            transition={{
                              duration: 0.6,
                              repeat: Infinity,
                              delay: i * 0.15,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 pb-8 border-t-4 border-gray-700 bg-white dark:bg-gray-950 rounded-b-[2.5rem]">
                {attachedStory && (
                  <div className="mb-2 flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded-lg">
                    <Newspaper className="w-4 h-4 text-gray-600" />
                    <span className="text-xs flex-1 truncate">{attachedStory.title}</span>
                    <button onClick={() => setAttachedStory(null)} className="text-gray-500 hover:text-gray-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Ask about news..."
                    rows={1}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-600 resize-none max-h-32"
                  />
                  
                  <div className="flex items-center justify-center gap-4">
                    <button 
                      onClick={() => setDeepThinking(!deepThinking)}
                      className={`p-2 rounded-lg transition-colors ${deepThinking ? 'bg-gray-600 text-white' : 'bg-gray-200 dark:bg-gray-800'} hover:bg-gray-700 hover:text-white group relative`}
                    >
                      {deepThinking ? <Brain className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {deepThinking ? 'Deep Thinking' : 'Fast Mode'}
                      </span>
                    </button>
                    <button className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors group relative">
                      <ImageIcon className="w-4 h-4" />
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Add Image
                      </span>
                    </button>
                    <button className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors group relative">
                      <Paperclip className="w-4 h-4" />
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Attach File
                      </span>
                    </button>
                    <button 
                      onClick={() => setShowStoryPicker(true)}
                      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors group relative"
                    >
                      <Newspaper className="w-4 h-4" />
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Attach Story
                      </span>
                    </button>
                    <button 
                      onClick={() => setShowStoryPicker(true)}
                      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors group relative"
                    >
                      <Pin className="w-4 h-4" />
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Pin Story
                      </span>
                    </button>
                  </div>

                  <motion.button
                    onClick={sendMessage}
                    disabled={(!input.trim() && !attachedStory) || isTyping}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    animate={isTyping ? {
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                    } : {}}
                    transition={isTyping ? { duration: 2, repeat: Infinity } : {}}
                    className="w-full h-14 rounded-full text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                    style={{
                      backgroundImage: isTyping ? 'linear-gradient(90deg, #3b82f6 0%, #ef4444 50%, #3b82f6 100%)' : 'none',
                      backgroundColor: isTyping ? 'transparent' : '#374151',
                      backgroundSize: '200% 100%',
                    }}
                  >
                    {isTyping ? (
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="w-1.5 h-1.5 bg-white rounded-full"
                              animate={{ y: [0, -4, 0] }}
                              transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: i * 0.15,
                              }}
                            />
                          ))}
                        </div>
                        <span>Thinking</span>
                      </div>
                    ) : (
                      <span>Send</span>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {showStoryPicker && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                onClick={() => setShowStoryPicker(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white dark:bg-gray-900 rounded-2xl border-4 border-blue-600 p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Select a Story</h3>
                    <button onClick={() => setShowStoryPicker(false)}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={storySearch}
                      onChange={(e) => setStorySearch(e.target.value)}
                      placeholder="Search stories..."
                      className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2">
                    {searchResults.map((story) => (
                      <div key={story.id} className="flex gap-2">
                        <button
                          onClick={() => {
                            setAttachedStory({
                              id: story.id,
                              title: story.title,
                              image: story.metadata?.image || story.metadata?.og_image,
                            });
                            setShowStoryPicker(false);
                            setStorySearch('');
                          }}
                          className="flex-1 flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 transition-colors text-left"
                        >
                          {(story.metadata?.image || story.metadata?.og_image) && (
                            <img
                              src={story.metadata?.image || story.metadata?.og_image}
                              alt=""
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-2">{story.title}</p>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            setPinnedStory({
                              id: story.id,
                              title: story.title,
                              image: story.metadata?.image || story.metadata?.og_image,
                              url: story.url,
                              isPinned: true,
                            });
                            setShowStoryPicker(false);
                            setStorySearch('');
                          }}
                          className="p-3 bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                          title="Pin to chat"
                        >
                          <Pin className="w-5 h-5 text-green-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {showCustomModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
                onClick={() => setShowCustomModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white dark:bg-gray-900 rounded-2xl border-4 border-blue-600 p-6 max-w-md w-full"
                >
                  <h3 className="text-lg font-bold mb-4">Create Custom Personality</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Personality Name</label>
                      <input
                        type="text"
                        value={customPersonality.name}
                        onChange={(e) => setCustomPersonality(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Tech Guru, Political Analyst"
                        className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Instructions</label>
                      <textarea
                        value={customPersonality.prompt}
                        onChange={(e) => setCustomPersonality(prev => ({ ...prev, prompt: e.target.value }))}
                        placeholder="Describe how Source AI should behave...\n\nExample:\nTone: Casual and friendly\nStyle: Use tech analogies\nFocus: Explain complex topics simply"
                        rows={6}
                        className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (customPersonality.name && customPersonality.prompt) {
                            setPersonality('custom');
                            setShowCustomModal(false);
                          }
                        }}
                        disabled={!customPersonality.name || !customPersonality.prompt}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => setShowCustomModal(false)}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </>
  );
}
