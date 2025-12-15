<script lang="ts">
  import { enhance } from '$app/forms';
  
  // Data passed from the server (the list of places)
  export let data;
  // Form response state (success/fail)
  export let form; 
</script>

<div class="container">
  <h1>Create New Tournament</h1>

  {#if form?.success}
    <div class="alert success">Tournament created successfully!</div>
  {/if}
  {#if form?.message}
    <div class="alert error">{form.message}</div>
  {/if}

  <form method="POST" use:enhance action="?/addTurniej">
    
    <div class="form-group">
      <label for="nazwa">Tournament Name</label>
      <input 
        type="text" 
        id="nazwa" 
        name="nazwa" 
        placeholder="e.g. Winter Cup 2024" 
        required 
      />
    </div>

    <div class="form-group">
      <label for="miejsceId">Location</label>
      <select id="miejsceId" name="miejsceId" required>
        <option value="" disabled selected>Select a location...</option>
        {#each data.places as place}
          <option value={place.miejscaID}>{place.nazwa || place.miejscaID}</option>
        {/each}
      </select>
    </div>

    <div class="row">
      <div class="form-group">
        <label for="data">Date</label>
        <input type="date" id="data" name="data" required />
      </div>

      <div class="form-group">
        <label for="godzina">Time</label>
        <input type="time" id="godzina" name="godzina" required />
      </div>
    </div>

    <button type="submit">Create Tournament</button>
  </form>
</div>

<div>
    {#each data.turnieje as {nazwa, godzina, adres, miasto, zwyciezca, twórcaTurnieju}}
        <li>{nazwa} | {godzina} | {adres} | {miasto} | {zwyciezca} | {twórcaTurnieju}</li>
    {/each}
</div>