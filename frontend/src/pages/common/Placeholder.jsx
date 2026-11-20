// A plain stand-in for pages that are built in a later stage, so every
// navigation destination already works. Each one is replaced by its real
// page in that stage.
import EmptyState from '../../components/EmptyState';
import PageFrame from '../../components/PageFrame';

export default function Placeholder({ title, stage, note }) {
  return (
    <PageFrame title={title}>
      <EmptyState art="counter" title={`Built in Stage ${stage}`} message={note} />
    </PageFrame>
  );
}
