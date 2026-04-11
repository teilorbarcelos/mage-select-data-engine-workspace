import { MageSelectEngineConfig } from 'mage-select-data-engine';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { MageSelect } from './MageSelect';

interface User {
  id: string;
  name: string;
  email: string;
}

const engineConfig: MageSelectEngineConfig<User> = {
  fetchPage: async (page: number, search: string) => {
    const url = new URL('http://localhost:3001/users');
    url.searchParams.set('page', page.toString());
    if (search) {
      url.searchParams.set('search', search);
      url.searchParams.set('columns', 'name,email');
    }
    const res = await fetch(url.toString());
    return res.json();
  },
  fetchByIds: async (ids) => {
    const res = await fetch(`http://localhost:3001/users/by-ids?ids=${ids.join(',')}`);
    return res.json();
  },
  getId: (user) => user.id,
};

function CreateForm() {
  const { control, handleSubmit } = useForm({
    defaultValues: { users: [] },
  });

  const onSubmit = (data: any) => alert('Created: ' + JSON.stringify(data));

  return (
    <div className="form-card">
      <h2>Create Flow (Empty initially)</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label>Assign Users</label>
          <MageSelect
            name="users"
            control={control}
            multiple
            engineConfig={engineConfig}
            placeholder="Search and select users..."
            renderItem={(u) => (
              <div>
                <div style={{ color: '#fff' }}>{u.name}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{u.email}</div>
              </div>
            )}
            renderSelection={(items) => items.map((i) => i.name).join(', ')}
          />
        </div>
        <button className="btn-submit" type="submit">Submit Create</button>
      </form>
    </div>
  );
}

function EditForm({ initialIds }: { initialIds: string[] }) {
  const { control, handleSubmit } = useForm({
    defaultValues: { users: initialIds },
  });

  const onSubmit = (data: any) => alert('Updated: ' + JSON.stringify(data));

  return (
    <div className="form-card">
      <h2>Edit Flow (Hydration)</h2>
      <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 12 }}>
        Simulating form populated with existing IDs but no data.
      </p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label>Assigned Users</label>
          <MageSelect
            name="users"
            control={control}
            multiple
            engineConfig={engineConfig}
            placeholder="Search and select users..."
            renderItem={(u) => (
              <div>
                <div style={{ color: '#fff' }}>{u.name}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{u.email}</div>
              </div>
            )}
            renderSelection={(items) => items.map((i) => i.name).join(', ')}
          />
        </div>
        <button className="btn-submit" type="submit">Submit Edit</button>
      </form>
    </div>
  );
}

function App() {
  const [demoIds, setDemoIds] = useState<string[] | null>(null);

  useEffect(() => {
    fetch('http://localhost:3001/users')
      .then((res) => res.json())
      .then((data) => {
        if (data.items && data.items.length >= 2) {
          setDemoIds([data.items[1].id, data.items[2].id]);
        }
      });
  }, []);

  return (
    <div className="app-container">
      <h1 style={{ textAlign: 'center', marginBottom: 40 }}>Mage Select Engine</h1>
      
      <div className="forms-grid">
        <CreateForm />
        {demoIds ? (
          <EditForm initialIds={demoIds} />
        ) : (
          <div className="form-card">
            <h2>Edit Flow</h2>
            <p>Loading valid IDs from database to demonstrate Hydration...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
