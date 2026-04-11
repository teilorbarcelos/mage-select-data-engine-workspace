import { MageSelectEngineConfig, createMageSelectEngine } from 'mage-select-data-engine';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { MageSelect } from './MageSelect';
import { VanillaMageSelect } from './VanillaMageSelect';

interface User {
  id: string;
  name: string;
  email: string;
}

interface FormValues {
  users: User[] | string[];
}

interface SimpleFormValues {
  user: User | string | null;
}

const engineConfig: MageSelectEngineConfig<User> = {
  fetchPage: async (page: number, search: string) => {
    const url = new URL('http://localhost:8888/users');
    url.searchParams.set('page', page.toString());
    if (search) {
      url.searchParams.set('search', search);
      url.searchParams.set('columns', 'name,email');
    }
    const res = await fetch(url.toString());
    return res.json();
  },
  fetchByIds: async (ids) => {
    const res = await fetch(`http://localhost:8888/users/by-ids?ids=${ids.join(',')}`);
    return res.json();
  },
  getId: (user) => user.id,
};

function CreateForm() {
  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: { users: [] },
    mode: 'all', // Real-time validation
  });

  const onSubmit = (data: FormValues) => {
    alert('✅ Create Success!\n\nPayload sent to React Hook Form:\n' + JSON.stringify(data, null, 2));
  };

  return (
    <div className="form-card">
      <div className="form-header">
        <h2>Create Flow</h2>
        <span className="badge">RHF Managed</span>
      </div>
      <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 16 }}>
        This form demonstrates mandatory selection using RHF <code>rules</code>.
      </p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label>Assign Users *</label>
          <MageSelect
            name="users"
            control={control}
            multiple
            rules={{ 
              required: 'Select at least one user to proceed',
              validate: (val: User[] | string[]) => val.length <= 3 || 'Maximum 3 users allowed for this role'
            }}
            engineOrConfig={engineConfig}
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
        <button className="btn-submit" type="submit">Submit Form</button>
      </form>
    </div>
  );
}

function EditForm({ initialIds }: { initialIds: string[] }) {
  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: { users: initialIds },
    mode: 'all', // Real-time validation
  });

  const onSubmit = (data: FormValues) => {
    alert('✅ Edit Success!\n\nSynchronized Data:\n' + JSON.stringify(data, null, 2));
  };

  return (
    <div className="form-card">
      <div className="form-header">
        <h2>Edit Flow</h2>
        <span className="badge">RHF Hydrated</span>
      </div>
      <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 12 }}>
        Demonstrating automatic hydration of IDs into full objects.
      </p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label>Assigned Users</label>
          <MageSelect
            name="users"
            control={control}
            multiple
            rules={{ 
              required: 'Select at least one user to proceed',
              validate: (val: User[] | string[]) => val.length <= 3 || 'Maximum 3 users allowed for this role'
            }}
            engineOrConfig={engineConfig}
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
        <button className="btn-submit" type="submit">Submit Update</button>
      </form>
    </div>
  );
}

function SimpleCreateForm() {
  const { control, handleSubmit } = useForm<SimpleFormValues>({
    defaultValues: { user: null },
    mode: 'all',
  });

  const onSubmit = (data: SimpleFormValues) => {
    alert('✅ Simple Create Success!\n\nPayload sent to React Hook Form:\n' + JSON.stringify(data, null, 2));
  };

  return (
    <div className="form-card">
      <div className="form-header">
        <h2>Simple Create</h2>
        <span className="badge">Single Mode</span>
      </div>
      <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 16 }}>
        Single selection implementation with <code>multiple={"{false}"}</code>.
      </p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label>Select Manager *</label>
          <MageSelect
            name="user"
            control={control}
            multiple={false}
            rules={{ required: 'Choosing a manager is required' }}
            engineOrConfig={engineConfig}
            placeholder="Select a manager..."
            renderItem={(u) => (
              <div>
                <div style={{ color: '#fff' }}>{u.name}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{u.email}</div>
              </div>
            )}
            renderSelection={(items) => items[0]?.name || ''}
          />
        </div>
        <button className="btn-submit" type="submit">Hire Manager</button>
      </form>
    </div>
  );
}

function SimpleEditForm({ initialId }: { initialId: string }) {
  const { control, handleSubmit } = useForm<SimpleFormValues>({
    defaultValues: { user: initialId },
    mode: 'all',
  });

  const onSubmit = (data: SimpleFormValues) => {
    alert('✅ Simple Edit Success!\n\nPayload sent to React Hook Form:\n' + JSON.stringify(data, null, 2));
  };

  return (
    <div className="form-card">
      <div className="form-header">
        <h2>Simple Edit</h2>
        <span className="badge">Hydration Mode</span>
      </div>
      <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 16 }}>
        Automatic hydration for a single ID selection.
      </p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label>Assign to Team</label>
          <MageSelect
            name="user"
            control={control}
            multiple={false}
            engineOrConfig={engineConfig}
            placeholder="Select a user..."
            renderItem={(u) => (
              <div>
                <div style={{ color: '#fff' }}>{u.name}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{u.email}</div>
              </div>
            )}
            renderSelection={(items) => items[0]?.name || ''}
          />
        </div>
        <button className="btn-submit" type="submit">Update Team</button>
      </form>
    </div>
  );
}


function VanillaCreateForm() {
  const [selection, setSelection] = useState<string[]>([]);

  const handleManualSubmit = () => {
    alert('🚀 Vanilla Create Success!\n\nManual state capture:\n' + JSON.stringify(selection, null, 2));
  };

  return (
    <div className="form-card vanilla">
      <div className="form-header">
        <h2>Vanilla Create</h2>
        <span className="badge warning">No Form Manager</span>
      </div>
      <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 16 }}>
        Using <code>useMageSelect</code> directly for full control.
      </p>
      <div className="form-group" style={{ marginBottom: 20 }}>
        <label>Select Participants</label>
        <VanillaMageSelect
          engineConfig={engineConfig}
          multiple={true}
          onSelectionChange={setSelection}
          placeholder="Directly using engine..."
          renderItem={(u) => (
            <div>
              <div style={{ color: '#fff' }}>{u.name}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{u.email}</div>
            </div>
          )}
          renderSelection={(items) => items.map(i => i.name).join(', ')}
        />
      </div>
      <button type="button" className="btn-submit" onClick={handleManualSubmit}>Log Current State</button>
    </div>
  );
}

function VanillaEditForm({ initialIds }: { initialIds: string[] }) {
  const [engine] = useState(() => createMageSelectEngine(engineConfig));

  useEffect(() => {
    engine.setValue(initialIds);
  }, [initialIds, engine]);

  const handleManualUpdate = () => {
    const selectedIds = engine.getState().selectedItems.map(i => engine.getId(i));
    alert('🔄 Vanilla Edit Success!\n\nCaptured IDs from engine:\n' + JSON.stringify(selectedIds, null, 2));
  };

  return (
    <div className="form-card vanilla">
      <div className="form-header">
        <h2>Vanilla Edit</h2>
        <span className="badge warning">Direct Hydration</span>
      </div>
      <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 16 }}>
        Engine hydration via manual <code>engine.setValue()</code>.
      </p>
      <div className="form-group" style={{ marginBottom: 20 }}>
        <label>Selected Members</label>
        <VanillaMageSelect
          engine={engine}
          engineConfig={engineConfig}
          placeholder="Hydrating manually..."
          renderItem={(u) => (
            <div>
              <div style={{ color: '#fff' }}>{u.name}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{u.email}</div>
            </div>
          )}
          renderSelection={(items) => items.map(i => i.name).join(', ')}
        />
      </div>
      <button type="button" className="btn-submit" onClick={handleManualUpdate}>Capture Engine Data</button>
    </div>
  );
}

function App() {
  const [demoIds, setDemoIds] = useState<string[] | null>(null);
  const [activeTab, setActiveTab] = useState<'multi' | 'single' | 'vanilla'>('multi');

  useEffect(() => {
    fetch('http://localhost:8888/users')
      .then((res) => res.json())
      .then((data) => {
        if (data.items && data.items.length >= 3) {
          setDemoIds([data.items[1].id, data.items[2].id]);
        }
      });
  }, []);

  return (
    <div className="app-container">
      <header style={{ textAlign: 'center', marginBottom: 60 }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: 12, background: 'linear-gradient(90deg, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Mage Select Engine
        </h1>
        <p style={{ opacity: 0.7, fontSize: 16 }}>Enterprise-grade full-stack select solution</p>
      </header>
      
      <nav className="mage-tabs-nav">
        <button 
          className={`mage-tab-item ${activeTab === 'multi' ? 'active' : ''}`}
          onClick={() => setActiveTab('multi')}
        >
          Multi-Selection (RHF)
        </button>
        <button 
          className={`mage-tab-item ${activeTab === 'single' ? 'active' : ''}`}
          onClick={() => setActiveTab('single')}
        >
          Single-Selection (RHF)
        </button>
        <button 
          className={`mage-tab-item ${activeTab === 'vanilla' ? 'active' : ''}`}
          onClick={() => setActiveTab('vanilla')}
        >
          Direct Engine (Vanilla)
        </button>
      </nav>

      <div className="tab-content" key={activeTab}>
        {activeTab === 'multi' && (
          <section>
            <h2 className="section-title">Multi-Selection Examples</h2>
            <div className="forms-grid">
              <CreateForm />
              {demoIds ? (
                <EditForm initialIds={demoIds} />
              ) : (
                <div className="form-card loading">
                  <h2>Edit Flow</h2>
                  <p>Hydrating data...</p>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'single' && (
          <section>
            <h2 className="section-title">Single-Selection Examples</h2>
            <div className="forms-grid">
              <SimpleCreateForm />
              {demoIds ? (
                <SimpleEditForm initialId={demoIds[0]} />
              ) : (
                <div className="form-card loading">
                  <h2>Simple Edit</h2>
                  <p>Hydrating data...</p>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'vanilla' && (
          <section>
            <h2 className="section-title">Direct Engine Usage (Vanilla React)</h2>
            <div className="forms-grid">
              <VanillaCreateForm />
              {demoIds ? (
                <VanillaEditForm initialIds={demoIds} />
              ) : (
                <div className="form-card loading">
                  <h2>Vanilla Edit</h2>
                  <p>Loading IDs...</p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default App;
