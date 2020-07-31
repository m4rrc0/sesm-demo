<script>
  let color = "red";

  const onClick = () => {
    color = color === "blue" ? "red" : "blue";
  };
</script>

<h1 style={`color: ${color}`} on:click={onClick}>Hello World</h1>
<a href="/tests/">Tests</a>
