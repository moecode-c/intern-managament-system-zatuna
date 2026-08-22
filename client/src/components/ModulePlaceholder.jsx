// Shown where an intern squad still has to build the real screen.
// Delete this component's usage when the page is implemented.
export default function ModulePlaceholder({ title, ticket, todos }) {
  return (
    <section className="placeholder">
      <h1>{title}</h1>
      <p className="muted">
        Not built yet - Jira <strong>{ticket}</strong>
      </p>
      <ul>
        {todos.map((todo) => (
          <li key={todo}>{todo}</li>
        ))}
      </ul>
    </section>
  );
}
