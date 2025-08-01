<script>
  import { onMount } from 'svelte'
  import { inertia } from '@inertiajs/svelte'
  import { fly, fade } from 'svelte/transition'
  
  // Clipboard functionality
  function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
  }
  
  // Load Prism.js for syntax highlighting
  onMount(() => {
    // Load Prism CSS
    const prismCSS = document.createElement('link')
    prismCSS.rel = 'stylesheet'
    prismCSS.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css'
    document.head.appendChild(prismCSS)
    
    // Load Prism JS
    const prismJS = document.createElement('script')
    prismJS.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js'
    prismJS.onload = () => {
      const prismTS = document.createElement('script')
      prismTS.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-typescript.min.js'
      prismTS.onload = () => {
        if (window.Prism) {
          window.Prism.highlightAll()
        }
      }
      document.head.appendChild(prismTS)
    }
    document.head.appendChild(prismJS)
  })
</script>

<svelte:head>
  <title>Laju - Ship Your Next Project Faster</title>
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-laju.png">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
</svelte:head>

<div class="bg-gray-50 dark:bg-gray-900 font-['Inter'] scroll-smooth">
  <!-- Hero Section -->
  <div class="relative overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 z-0"></div>
    <nav class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      <div class="flex justify-between items-center">
        <div class="text-3xl font-bold text-emerald-600">
          <img class="h-14" src="/laju-logo.png" alt="Laju Logo">
        </div>
        <div class="flex space-x-6">
          <a href="https://github.com/maulanashalihin/laju" class="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">GitHub</a>
          <a href="/login" use:inertia class="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Login</a>
          <a href="/register" use:inertia class="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">Get Started</a>
        </div>
      </div>
    </nav>

    <main class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
      <div class="text-center" in:fly={{ y: 20, duration: 800, delay: 200 }}>
        <h1 class="text-5xl font-bold text-gray-900 dark:text-white mb-6">
          Build Faster with <span class="text-emerald-600">Lajuz</span>
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-300 mb-4 max-w-2xl mx-auto">
          A high-performance TypeScript web framework for building modern full-stack applications with speed and elegance.
        </p>
        <p class="text-lg text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
          <span class="italic">Laju</span> — Indonesian word for "fast" or "swift" — embodies our framework's core mission:
          delivering exceptional speed without compromising developer experience.
        </p>
        <div class="flex justify-center space-x-4 flex-wrap gap-4">
          <a href="#features" class="px-8 py-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
            Explore Features
          </a>
          <a href="https://github.com/maulanashalihin/laju" class="px-8 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-emerald-400 hover:text-emerald-600 transition-colors">
            View on GitHub
          </a>
        </div>
      </div>

      <!-- Stats Section -->
      <div class="mt-16 px-4 sm:px-6 lg:px-8" in:fly={{ y: 20, duration: 800, delay: 400 }}>
        <h2 class="text-2xl font-semibold text-center text-gray-900 dark:text-white mb-8">Blazing Fast Performance</h2>
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div class="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-200 dark:divide-gray-700">
            <div class="p-4 md:p-6 text-center">
              <div class="text-2xl md:text-4xl font-bold text-emerald-600">254,595</div>
              <div class="text-sm text-gray-600 dark:text-gray-400 mt-2">Requests/s</div>
            </div>
            <div class="p-4 md:p-6 text-center">
              <div class="text-2xl md:text-4xl font-bold text-emerald-600">1.55ms</div>
              <div class="text-sm text-gray-600 dark:text-gray-400 mt-2">Latency</div>
            </div>
            <div class="p-4 md:p-6 text-center">
              <div class="text-2xl md:text-4xl font-bold text-emerald-600">21.12</div>
              <div class="text-sm text-gray-600 dark:text-gray-400 mt-2">MB/s Throughput</div>
            </div>
            <div class="p-4 md:p-6 text-center">
              <div class="text-2xl md:text-4xl font-bold text-emerald-600">100%</div>
              <div class="text-sm text-gray-600 dark:text-gray-400 mt-2">Faster than Node.js</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Getting Started Section -->
      <div class="mt-16" in:fly={{ y: 20, duration: 800, delay: 600 }}>
        <h2 class="text-2xl font-semibold text-center text-gray-900 dark:text-white mb-8">Get Started in Seconds</h2>
        <div class="max-w-3xl mx-auto bg-gray-900 dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div class="p-6">
            <div class="flex items-center space-x-2 mb-4">
              <div class="w-3 h-3 rounded-full bg-red-500"></div>
              <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div class="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <pre class="text-sm md:text-base !bg-gray-900"><code class="language-typescript bg-gray-900 text-gray-300">// app/controllers/HomeController.ts
import &#123; Response, Request &#125; from "../../type";

class Controller &#123;
    async index(request: Request, response: Response) &#123;
        return response.inertia("Landing", &#123;&#125;);
    &#125;
&#125;

export default new Controller();

// routes/web.ts
import HomeController from "../app/controllers/HomeController"; 
import HyperExpress from 'hyper-express';

const Route = new HyperExpress.Router();
 
Route.get("/", HomeController.index);</code></pre>
          </div>
        </div>
        <div class="mt-8 text-center">
          <p class="text-lg text-gray-600 dark:text-gray-300 mb-6">
            Just a few lines of code to get your server up and running. No complex configurations, no boilerplate.
          </p>
          <a href="https://github.com/maulanashalihin/laju.git" class="text-emerald-600 hover:text-emerald-700 font-semibold">
            View Documentation →
          </a>
        </div>
      </div>

      <!-- Features Section -->
      <div id="features" class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 px-4 sm:px-6 lg:px-8">
        {#each [
          {
            title: "Frontend",
            icon: "M13 10V3L4 14h7v7l9-11h-7z",
            features: [
              "• Svelte - Reactive UI framework",
              "• Inertia - Modern monolith", 
              "• TailwindCSS - Utility-first CSS",
              "• Vite - Next gen bundling"
            ]
          },
          {
            title: "Backend",
            icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
            features: [
              "• Hyper Express - Ultra-fast server",
              "• TypeScript - Type safety",
              "• File Generator - Quick scaffolding",
              "• MVC Architecture"
            ]
          },
          {
            title: "Database",
            icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21-3.582 4-8 4s-8-1.79-8-4",
            features: [
              "• Knex.js - SQL query builder",
              "• Migrations support",
              "• Multiple DB support",
              "• Type-safe queries"
            ]
          }
        ] as feature, i}
          <div 
            class="p-6 rounded-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-600 transition-colors"
            in:fly={{ y: 20, duration: 800, delay: 800 + (i * 100) }}
          >
            <div class="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={feature.icon} />
              </svg>
            </div>
            <div class="text-emerald-600 text-xl font-semibold mb-4">{feature.title}</div>
            <ul class="space-y-3 text-gray-600 dark:text-gray-300">
              {#each feature.features as item}
                <li>{item}</li>
              {/each}
            </ul>
          </div>
        {/each}
      </div>

      <!-- CTA Section -->
      <div class="mt-24 text-center px-4 sm:px-6 lg:px-8" in:fly={{ y: 20, duration: 800, delay: 1200 }}>
        <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">Ready to build something amazing?</h2>
        <div class="inline-flex items-center space-x-2 bg-gray-800 dark:bg-gray-700 text-gray-200 p-3 rounded-lg font-mono text-sm max-w-full overflow-x-auto">
          <code class="whitespace-nowrap">npx create-laju-app my-app</code>
          <button
            on:click={() => copyToClipboard('npx create-laju-app my-app')}
            class="hover:text-emerald-400 flex-shrink-0 transition-colors"
            title="Copy to clipboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>
    </main>
  </div>
</div>

<style>
  /* Ensure Prism styles work correctly */
  :global(pre[class*="language-"]) {
    background: #1a1a1a !important;
  }
  
  :global(code[class*="language-"]) {
    background: #1a1a1a !important;
    color: #d1d5db !important;
  }
</style>