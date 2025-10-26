<script lang="ts">
	export let data;
</script>

<div class="max-w-2xl mx-auto">
	<h1 class="text-2xl font-semibold mb-4">Debug: Auth State</h1>

	<div class="space-y-4">
		<div class="border rounded p-4">
			<h2 class="font-semibold mb-2">User</h2>
			<pre class="bg-gray-100 p-2 rounded text-sm overflow-auto">
{JSON.stringify(data.user, null, 2)}
			</pre>
		</div>

		<div class="border rounded p-4">
			<h2 class="font-semibold mb-2">Session</h2>
			<pre class="bg-gray-100 p-2 rounded text-sm overflow-auto">
{JSON.stringify(data.session, null, 2)}
			</pre>
		</div>
	</div>
</div>
