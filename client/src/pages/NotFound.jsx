import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="card narrow">
      <h1>404</h1>
      <p>That page does not exist.</p>
      <Link to="/">Back home</Link>
    </section>
  );
}
