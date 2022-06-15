(() => {
  async function post(endpoint, body) {
    return JSON.parse(await (await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })).text());
  }
  async function get(endpoint) {
    return JSON.parse(await (await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })).text());
  }
  async function patch(endpoint, body) {
    return JSON.parse(await (await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })).text());
  }
  class Note {
    constructor(name, text="") {
      this.name = name;
      this.text = text;
    }
    static list() {
      return await get('/note/list');
    }
    static fetch(name) {
      return new Note(name, await post('/note/fetch', name));
    }
    edit(text, save=false) {
      this.text = text;
      save && this.save();
    }
    save() {
      patch('/note/edit', {
        name: this.name,
        text: this.text
      }).then(() => {
        return true;
      }).catch(err => {
        throw err;
        return false;
      });
    }
  }
})();