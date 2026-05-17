<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.seo.title}</title>
	<meta name="description" content={data.seo.description} />
	<meta name="keywords" content={data.seo.keywords} />
	<link rel="canonical" href={data.seo.canonical} />
	<meta property="og:title" content={data.seo.ogTitle} />
	<meta property="og:description" content={data.seo.ogDescription} />
	<meta property="og:url" content={data.seo.ogUrl} />
	<meta property="og:type" content={data.seo.ogType} />
	<meta property="og:site_name" content={data.seo.ogSiteName} />
	<meta name="twitter:card" content={data.seo.twitterCard} />
	<meta name="twitter:title" content={data.seo.twitterTitle} />
	<meta name="twitter:description" content={data.seo.twitterDescription} />
	{@html `<script type="application/ld+json">${data.seo.jsonLdString}</script>`}
</svelte:head>

<div class="container">
	<nav class="breadcrumbs" aria-label="Breadcrumb">
		<a href="/">Home</a>
		<span class="separator" aria-hidden="true">/</span>
		<span class="current">How to Play</span>
	</nav>
</div>

<div class="content-page container">
	<h1>How to Play LinkedIn Pinpoint</h1>
	<p class="page-desc">A complete guide to LinkedIn's word association puzzle — from basic rules to advanced strategies that help you solve faster.</p>

	<h2>What Is LinkedIn Pinpoint?</h2>
	<p>LinkedIn Pinpoint is a daily word puzzle game available on LinkedIn's games section. The game presents you with five clues, each pointing to the same underlying concept, category, or word. Your job is to figure out the connecting thread before all five clues are revealed. Think of it as a word association game where the clues progressively make the answer more obvious.</p>
	<p>The game launched in early 2025 as part of LinkedIn's push into casual gaming, joining other daily puzzles like Queens, Crossclimb, and Tango. Pinpoint stands out because it tests vocabulary breadth and lateral thinking rather than logic or trivia knowledge.</p>

	<h2>Basic Rules</h2>
	<p>The rules of Pinpoint are straightforward, but the challenge comes from the word associations themselves. Here is exactly how a round works:</p>
	<ol>
		<li><strong>You start with one clue.</strong> The first clue is shown immediately. It is intentionally vague — just one word or short phrase that could point to many different concepts.</li>
		<li><strong>Guess the connecting category.</strong> Based on the clue (or clues) you have, type in your guess for what ties them all together. The answer is usually a category name, a shared characteristic, or a common theme.</li>
		<li><strong>Wrong guesses reveal the next clue.</strong> If your guess is wrong, the second clue appears. Each incorrect guess reveals one more clue, making the answer progressively clearer.</li>
		<li><strong>You have five clues total.</strong> If you have not solved it after all five clues are shown, the round ends and the answer is revealed.</li>
		<li><strong>Fewer clues = better score.</strong> Solving with just one or two clues is considered excellent. Most players aim to solve by clue three. Using all five clues means you got it, but it took a while.</li>
	</ol>
	<p>There is no time limit. You can think about each clue for as long as you want. There is also no limit on the number of guesses you can make — though each wrong guess does reveal the next clue.</p>

	<h2>How Scoring Works</h2>
	<p>LinkedIn Pinpoint does not have a points system in the traditional sense. Instead, your performance is measured by how many clues you needed to solve the puzzle. Solving on clue one is the best possible result. Solving on clue five is the worst (besides not solving at all). The game tracks your performance over time, and you can see how you compare to your connections on LinkedIn.</p>
	<p>The scoring breakdown roughly looks like this: solving on clue one is exceptional (you either knew the answer or made a brilliant leap). Clue two is very good. Clue three is average. Clue four means the connection was not clicking for you. Clue five means you needed all the help available. And if you do not solve it at all, the answer is simply revealed.</p>

	<h2>Strategies for Solving Faster</h2>
	<p>After playing hundreds of Pinpoint puzzles, certain strategies consistently help players solve with fewer clues. Here are the ones that work best:</p>

	<h3>1. Think Broad First, Then Narrow</h3>
	<p>The first clue is intentionally ambiguous. Do not try to nail the exact answer from one clue. Instead, think of the broad category it might belong to. If the first clue is "Saturn," the answer could be about planets, Roman gods, cars, or something else entirely. Do not commit to a specific answer until you have at least two clues to cross-reference.</p>

	<h3>2. Look for Connections Between Clues</h3>
	<p>Once the second clue appears, start looking for the intersection. What do both clues have in common? The answer is usually at the intersection, not along one clue's path. If clue one is "Saturn" and clue two is "Mercury," the overlapping concepts are planets and Roman gods. That narrows your guess significantly.</p>

	<h3>3. Consider Multiple Meanings</h3>
	<p>Pinpoint loves clues that have double meanings. "Mercury" could be a planet, a metal, a car brand, or a Roman god. When a clue seems to point in an obvious direction, consider whether there is a less obvious interpretation that might connect better with the other clues.</p>

	<h3>4. Guess Categories, Not Specific Items</h3>
	<p>The answer in Pinpoint is almost always a category or theme, not a specific item. Think "things found in a kitchen" rather than "refrigerator." Think "board games" rather than "Monopoly." If you find yourself guessing specific items, zoom out to the category level.</p>

	<h3>5. Use Our Explanations to Learn Patterns</h3>
	<p>After each daily puzzle, read our explanation of how the clues connect to the answer. Over time, you will start recognizing common patterns in how Pinpoint constructs its puzzles. Certain categories (chemistry lab equipment, things in a wallet, types of dance) come up repeatedly. Learning these patterns helps you guess faster on future puzzles.</p>

	<h2>Practice Makes Perfect</h2>
	<p>The daily puzzle is just one round per day, but you can practice as much as you want with our <a href="/unlimited">Pinpoint Unlimited Game</a>. It pulls from our archive of hundreds of historical puzzles and shuffles them randomly, so you can play round after round and sharpen your word association skills. Each wrong guess reveals the next clue, just like the real game. Your streak and stats are tracked locally in your browser.</p>

	<h2>Frequently Asked Questions</h2>

	<h3>How many clues do you get in LinkedIn Pinpoint?</h3>
	<p>You get a maximum of 5 clues in LinkedIn Pinpoint. The first clue is shown immediately, and each wrong guess reveals the next clue. Your goal is to guess the answer using as few clues as possible.</p>

	<h3>What happens if I guess wrong in Pinpoint?</h3>
	<p>Each wrong guess reveals the next clue. You can keep guessing until you get it right or use all 5 clues. There is no penalty for wrong guesses other than revealing more clues, which affects your score.</p>

	<h3>Can I play LinkedIn Pinpoint more than once a day?</h3>
	<p>The daily puzzle can only be played once per day. However, you can practice with our <a href="/unlimited">Unlimited Game mode</a>, which lets you play random historical puzzles as many times as you want.</p>

	<h3>Is LinkedIn Pinpoint free?</h3>
	<p>Yes, LinkedIn Pinpoint is completely free to play. You just need a LinkedIn account. No premium subscription is required. Our site, which provides answers and explanations, is also completely free.</p>

	<h2>Ready to Play?</h2>
	<p>Now that you know the rules and strategies, <a href="/today">check today's answer</a> to see how the clues connected, or <a href="/unlimited">jump into unlimited practice mode</a> to test your skills. Good luck!</p>
</div>
