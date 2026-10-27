const STORAGE_KEY = "sl-todos";

let todos = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
let filter = "all";

const list = document.getElementById("list");
const count = document.getElementById("count");

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function visibleTodos() {
  if (filter === "active") return todos.filter((todo) => !todo.done);
  if (filter === "done") return todos.filter((todo) => todo.done);
  return todos;
}

function render() {
  list.replaceChildren();
  const items = visibleTodos();

  if (!items.length) {
    const empty = document.createElement("li");
    empty.className = "meta";
    empty.textContent = filter === "all" ? "Nothing here yet — add a todo." : "Nothing in this filter.";
    list.append(empty);
  }

  for (const todo of items) {
    const item = document.createElement("li");
    item.className = "todo" + (todo.done ? " is-done" : "");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.done;
    checkbox.addEventListener("change", () => {
      todo.done = checkbox.checked;
      save();
      render();
    });

    const label = document.createElement("span");
    label.className = "label";
    label.textContent = todo.text;

    const remove = document.createElement("button");
    remove.className = "remove";
    remove.type = "button";
    remove.setAttribute("aria-label", "Delete todo");
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      todos = todos.filter((other) => other !== todo);
      save();
      render();
    });

    item.append(checkbox, label, remove);
    list.append(item);
  }

  const remaining = todos.filter((todo) => !todo.done).length;
  count.textContent = `${remaining} of ${todos.length} left`;
}

document.getElementById("add-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.getElementById("new-todo");
  const text = input.value.trim();
  if (!text) return;
  todos.unshift({ text, done: false });
  input.value = "";
  save();
  render();
});

document.getElementById("filters").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-filter]");
  if (!button) return;
  filter = button.dataset.filter;
  for (const other of event.currentTarget.querySelectorAll("button")) {
    other.classList.toggle("is-active", other === button);
  }
  render();
});

document.getElementById("clear-done").addEventListener("click", () => {
  todos = todos.filter((todo) => !todo.done);
  save();
  render();
});

render();
