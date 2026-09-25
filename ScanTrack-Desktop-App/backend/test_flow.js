
import { db } from './firebase.js';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const API_URL = 'http://localhost:5000/api';

async function runTest() {
  console.log('--- Starting End-to-End Flow Test ---');
  let itemId = null;
  let orderId = null;

  try {
    // 1. Create a new item (Desktop App flow)
    console.log('\n[Desktop] Registering a new item...');
    const itemPayload = {
      item_type: 'Test Flow Yarn',
      weight: 50,
      rack_id: 'RACK-A',
      bin: 'BIN-1',
      lot_number: 'LOT-TEST-999',
      quality_grade: 'A'
    };
    let res = await fetch(`${API_URL}/rolls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemPayload)
    });
    let data = await res.json();
    if (!res.ok) throw new Error('Failed to create item: ' + JSON.stringify(data));
    itemId = data.id;
    console.log(`✅ Item created: ${itemId} | State: ${data.state}`);

    // 2. Create an order (Desktop App flow)
    console.log('\n[Desktop] Creating a new order...');
    const orderPayload = {
      customer_name: 'Test Customer',
      items: [{ item_type: 'Test Flow Yarn', quantity: 1 }]
    };
    res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });
    data = await res.json();
    if (!res.ok) throw new Error('Failed to create order: ' + JSON.stringify(data));
    orderId = data.id;
    console.log(`✅ Order created: ${orderId} | Status: ${data.status}`);

    // 3. Approve the order (Desktop App flow)
    console.log(`\n[Desktop] Approving order ${orderId}...`);
    res = await fetch(`${API_URL}/orders/${orderId}/approve`, { method: 'POST' });
    data = await res.json();
    if (!res.ok) throw new Error('Failed to approve order: ' + JSON.stringify(data));
    console.log(`✅ Order approved. Reserved items.`);

    // 4. Verify item state is RESERVED
    res = await fetch(`${API_URL}/rolls/${itemId}`);
    data = await res.json();
    console.log(`✅ Item ${itemId} verified state: ${data.state} (Expected: RESERVED)`);
    if (data.state !== 'RESERVED') throw new Error(`State mismatch: expected RESERVED but got ${data.state}`);

    // 5. Mobile App Flow: Pick the item
    console.log('\n[Mobile] Scanning and picking the item...');
    const itemRef = doc(db, 'items', itemId);
    await updateDoc(itemRef, { state: 'PICKED' });
    let itemSnap = await getDoc(itemRef);
    let itemData = itemSnap.data();
    console.log(`✅ Item ${itemId} verified state: ${itemData.state} (Expected: PICKED)`);
    if (itemData.state !== 'PICKED') throw new Error(`State mismatch: expected PICKED but got ${itemData.state}`);

    // 6. Mobile App Flow: Dispatch the item
    console.log('\n[Mobile] Confirming dispatch for the item...');
    await updateDoc(itemRef, { state: 'DISPATCHED', delivered_at: new Date().toISOString() });
    itemSnap = await getDoc(itemRef);
    itemData = itemSnap.data();
    console.log(`✅ Item ${itemId} verified state: ${itemData.state} (Expected: DISPATCHED)`);
    if (itemData.state !== 'DISPATCHED') throw new Error(`State mismatch: expected DISPATCHED but got ${itemData.state}`);

    console.log('\n🎉 ALL FLOWS COMPLETED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

runTest();
