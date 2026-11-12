const { supabaseAdmin, createAnonClient, createUserClient } = require('./config/supabase');

const rand = Math.random().toString(36).slice(2, 8);
const password = 'TestPass123!';
const users = {
  A: { email: `a_${rand}@example.com` },
  B: { email: `b_${rand}@example.com` },
};

async function setup(label) {
  const u = users[label];
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: u.email, password, email_confirm: true, // no email sent
  });
  if (error) throw error;
  u.id = data.user.id;

  const { data: s, error: e2 } = await createAnonClient().auth.signInWithPassword({ email: u.email, password });
  if (e2) throw e2;
  u.token = s.session.access_token;
}

(async () => {
  try {
    await setup('A');
    await setup('B');

    // 1. Trigger check: profile rows exist (admin bypasses RLS, so this just checks the trigger)
    const { data: all } = await supabaseAdmin.from('profiles').select('id').in('id', [users.A.id, users.B.id]);
    console.log(`Trigger created profiles: ${all.length === 2 ? 'PASS' : 'FAIL'} (${all.length}/2)`);

    // 2. A selects ALL profiles: should only see their own
    const a = createUserClient(users.A.token);
    const { data: aRows } = await a.from('profiles').select('id');
    console.log(`A sees only own row: ${aRows.length === 1 && aRows[0].id === users.A.id ? 'PASS' : 'FAIL'} (${aRows.length} rows)`);

    // 3. A targets B's row directly: should get nothing
    const { data: aSeesB } = await a.from('profiles').select('*').eq('id', users.B.id);
    console.log(`A cannot read B: ${aSeesB.length === 0 ? 'PASS' : 'FAIL'}`);

    // 4. A tries to update B's row: should change nothing
    const { data: upd } = await a.from('profiles').update({ full_name: 'HACKED' }).eq('id', users.B.id).select();
    console.log(`A cannot update B: ${upd.length === 0 ? 'PASS' : 'FAIL'}`);
  } catch (err) {
    console.error('Test error:', err.message);
  } finally {
    for (const u of Object.values(users)) {
      if (u.id) await supabaseAdmin.auth.admin.deleteUser(u.id);
    }
    console.log('Cleaned up test users.');
  }
})();