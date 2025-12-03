import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        <h1 className="text-5xl font-bold mb-4 text-gray-900 dark:text-gray-100">Why We Built Source News</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-12">A Manifesto</p>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2 className="text-3xl font-bold mt-12 mb-4 text-gray-900 dark:text-gray-100">The Beginning</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            News in Nigeria has always been loud, vibrant, powerful—but fragmented. You can feel the energy across headlines, 
            yet the truth is often buried under layers of bias, broken narratives, and scattered reporting. As a reader, 
            navigating Nigerian news feels like detective work: multiple tabs, conflicting stories, missing details, and endless 
            questions of who to trust.
          </p>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Source News was born from one simple observation: <span className="font-semibold italic">We deserve better infrastructure for information.</span> Nigeria deserves a platform where clarity wins, where truth is not a puzzle, and where readers are empowered—not overwhelmed.
          </p>

          <h2 className="text-3xl font-bold mt-12 mb-4 text-gray-900 dark:text-gray-100">The Problem We Saw</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            The Nigerian media landscape is huge. Traditional newspapers. Online blogs. Independent voices. Social platforms. 
            Hundreds of outlets fighting for attention.
          </p>
          <p className="text-gray-700 dark:text-gray-300 mb-4">But with that abundance comes a real cost:</p>
          <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300 space-y-2">
            <li><span className="font-semibold">Fragmentation:</span> Stories are scattered everywhere.</li>
            <li><span className="font-semibold">Bias:</span> Many outlets frame narratives differently to match their audience or agenda.</li>
            <li><span className="font-semibold">Inconsistency:</span> The same event can sound like two different realities.</li>
            <li><span className="font-semibold">Overload:</span> Readers don't have the time to verify every perspective.</li>
            <li><span className="font-semibold">Misinformation:</span> In the rush to publish, accuracy is often sacrificed.</li>
          </ul>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            The result? Readers feel lost, distrust grows, and the public conversation becomes more confusing than enlightening.
          </p>

          <h2 className="text-3xl font-bold mt-12 mb-4 text-gray-900 dark:text-gray-100">The Vision</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Source News was built to solve this—not with guesswork, but with intelligence. Not with another news site, 
            but with a new <span className="italic">system</span> for how Nigerians consume information.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 p-6 my-8">
            <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
              A single platform where the truth emerges through transparency, multiple perspectives, and intelligent analysis.
            </p>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-2">Not by replacing journalists.</p>
          <p className="text-gray-700 dark:text-gray-300 mb-2">Not by rewriting history.</p>
          <p className="text-gray-700 dark:text-gray-300 mb-4">But by presenting the facts clearly and giving readers the tools to understand them.</p>

          <h2 className="text-3xl font-bold mt-12 mb-4 text-gray-900 dark:text-gray-100">What We're Building</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Source News uses modern AI to rethink how news works in Nigeria.
          </p>
          <p className="text-gray-700 dark:text-gray-300 mb-4">We:</p>
          <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300 space-y-2">
            <li>Aggregate reliable stories from multiple Nigerian outlets.</li>
            <li>Use AI to analyze sentiment, compare real differences, and detect potential bias.</li>
            <li>Summarize long articles into clear briefs.</li>
            <li>Cluster related stories so readers can follow events naturally.</li>
            <li>Map story timelines to show developments over time.</li>
            <li>Maintain a clean, modern interface built for real Nigerians—not global templates.</li>
            <li>Give readers the full picture, not just the loudest headline.</li>
          </ul>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            This is not a shortcut. It's infrastructure. It's the groundwork for a future where Nigerians always have access 
            to a transparent, multi-angle news experience.
          </p>

          <h2 className="text-3xl font-bold mt-12 mb-4 text-gray-900 dark:text-gray-100">Built by a Young Nigerian Developer</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Source News is not the creation of a media conglomerate. It wasn't funded by foreign money. It wasn't modeled after Silicon Valley.
          </p>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            It began with a laptop, curiosity, frustration, and belief.
          </p>
          <p className="text-gray-700 dark:text-gray-300 mb-2">Belief that Nigerian readers deserve better.</p>
          <p className="text-gray-700 dark:text-gray-300 mb-2">Belief that truth shouldn't be so hard to find.</p>
          <p className="text-gray-700 dark:text-gray-300 mb-4">Belief that if we build the right tools, people will use them.</p>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Nigeria has some of the brightest minds in journalism and storytelling. What we've lacked is <span className="font-semibold">infrastructure</span>—the kind that helps amplify the work of journalists instead of burying it in noise.
          </p>
          <p className="text-gray-700 dark:text-gray-300 mb-4">Source News is part of fixing that.</p>

          <h2 className="text-3xl font-bold mt-12 mb-4 text-gray-900 dark:text-gray-100">The Future of News Consumption in Nigeria</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">We're shaping a new way of consuming news—one built on:</p>
          <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300 space-y-2">
            <li><span className="font-semibold">Transparency:</span> Multiple sources, visible bias markers, clear context.</li>
            <li><span className="font-semibold">Speed:</span> Instant summaries and instant comparisons.</li>
            <li><span className="font-semibold">Depth:</span> Related coverage, timelines, and analysis.</li>
            <li><span className="font-semibold">Fairness:</span> No single source dominates the narrative.</li>
            <li><span className="font-semibold">Access:</span> Every Nigerian deserves good information, regardless of device or bandwidth.</li>
          </ul>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            We want a Nigeria where people form opinions based on full context—not gossip, not speculation, not headlines designed to shock.
          </p>

          <h2 className="text-3xl font-bold mt-12 mb-4 text-gray-900 dark:text-gray-100">For Journalists and Bloggers</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Journalism is powerful, but the distribution has been broken.
          </p>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Source News is also built for writers, reporters, and bloggers who want their work to reach real audiences.
          </p>
          <p className="text-gray-700 dark:text-gray-300 mb-4">When a journalist publishes a story, Source News can:</p>
          <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300 space-y-2">
            <li>Index it in real-time.</li>
            <li>Place it side-by-side with related coverage.</li>
            <li>Provide sentiment and bias analysis.</li>
            <li>Connect it with engaged readers.</li>
            <li>Offer analytics on reach and impact.</li>
          </ul>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Whether you run a blog, contribute to an online platform, or publish independently—<span className="font-semibold">you deserve visibility</span>.
          </p>
          <p className="text-gray-700 dark:text-gray-300 mb-6">Source News is where your voice gets discovered.</p>

          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 my-8">
            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">Join as a Content Creator</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Whether you run a blog, work for a news outlet, or publish independently—we want to amplify your voice.
            </p>
            <a 
              href="mailto:partnerships@source-news.ng?subject=Content Creator Partnership"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Partner With Us
            </a>
          </div>

          <h2 className="text-3xl font-bold mt-12 mb-4 text-gray-900 dark:text-gray-100">Built in Public. Improved With You.</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">This is version 1.0.</p>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            We're improving, listening, iterating, and building in public—because transparency shouldn't just be a feature; it should be a culture.
          </p>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            If you have ideas, criticisms, feature requests, or bugs to report, we're open. If you want to collaborate, we're open. If you want to grow with us, we're open.
          </p>

          <div className="border-t border-gray-200 dark:border-gray-800 pt-8 mt-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">Get in Touch</h2>
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              <p>Email: <a href="mailto:hello@source-news.ng" className="text-blue-600 hover:underline">hello@source-news.ng</a></p>
              <p>Twitter: <a href="https://twitter.com/SourceNews_NG" className="text-blue-600 hover:underline">@SourceNews_NG</a></p>
              <p>For partnerships: <a href="mailto:partnerships@source-news.ng" className="text-blue-600 hover:underline">partnerships@source-news.ng</a></p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-red-600 text-white rounded-lg p-10 mt-12 text-center">
            <h2 className="text-3xl font-bold mb-3">Built for Nigeria, by a Nigerian</h2>
            <p className="text-lg text-blue-50 mb-2">This is only the beginning.</p>
            <p className="text-blue-50 mb-6">
              Source News is our attempt to reshape how millions of Nigerians understand their world—one story at a time.
            </p>
            <p className="text-blue-50 mb-8">
              If you believe in clarity, in transparency, in truth, and in building something better for the future of media in Nigeria—join us.
            </p>
            <p className="text-xl font-semibold text-white mb-6">Let's build the future of Nigerian news.</p>
            <Link 
              href="/auth/signup"
              className="inline-block px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Create a Free Account — Be Part of the Future
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
