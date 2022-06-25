async function apiRequest(route, obj, method="POST") {
  if (method == "GET") {
    return JSON.parse(await (await fetch(route, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })).text());
  }
  
  let parts = [];
  for (var p in obj) {
    if (obj.hasOwnProperty(p)) {
      parts.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
  }
  const data = parts.join("&");

  let res;
  try {
    const res = await fetch(route, {
      method: method,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: data,
    });
    // even if the status code is bad, try to show the error sent in JSON
    let err = `Unexpected status code ${res.status}`;
    let json = {};
    try {
      json = await res.json();
    } catch (e) {
      console.error(e);
      // If the response was unsucessful, complain about that
      // otherwise, complain about the parse failure
      throw new Error(res.ok ? "Couldn't parse response" : err);
    }
    if (!res.ok) {
      console.log(json);
      throw new Error(json.error || err);
    }
    return json;
  } catch (e) {
    console.error(`Error in request to ${route}:`, e);
    res = { error: e };
  }
  return res;
}

class Note {
  constructor(name, text="") {
    this.name = name;
    this.text = text;
  }
  static list() {
    return new Promise(function(resolve, reject) {
      apiRequest('/note/list', null, 'GET').then(notes => resolve(notes));
    });
  }
  static fetch(name) {
    return new Promise(function(resolve, reject) {
      apiRequest('/note/fetch', {name: name}, 'POST').then(content => {
        resolve(new Note(name, content))
      });
    });
  }
  static create(name) {
    return new Promise(function(resolve, reject) {
      apiRequest('/note', {name: name}, 'POST').then(content => {resolve(new Note(name))});
    });
  }
  async edit(text, save=false) {
    this.text = text;
    if (save)
      await this.save();
  }
  async save() {
    await apiRequest('/note', {
      name: this.name,
      text: this.text
    }, 'PATCH').then(() => {
      return true;
    }).catch(err => {
      throw err;
      return false;
    });
  }
  async rename(newName) {
    await apiRequest('/note/rename', {
      name: this.name,
      new_name: newName
    }, 'PATCH')
    return newName;
  }
  async delete() {
    await apiRequest('/note', {
      name: this.name
    }, 'DELETE').then(() => {
      return true;
    }).catch(err => {
      throw err;
      return false;
    });
  }
}
