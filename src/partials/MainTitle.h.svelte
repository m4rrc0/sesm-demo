<script>
  import { onMount } from 'svelte';

  export let altColor;
  let color = 'red';

  const onClick = () => {
    color = color === altColor ? 'red' : altColor;
  };

  // onMount(async () => {
  //   onClick();
  // });
</script>

<h1 id="MainTitle" style={`color: ${color}`} on:click={onClick}>Hello World</h1>
