<script>
  import MainTitle from '../partials/MainTitle.h.svelte';
  import LinkTest from '../partials/LinkTest.svelte';
</script>

<div class="page">
  <LinkTest />
  <p>Hola</p>
  <MainTitle altColor="pink" />
  <MainTitle altColor="green">
    <div>Some useless child</div>
  </MainTitle>
</div>
