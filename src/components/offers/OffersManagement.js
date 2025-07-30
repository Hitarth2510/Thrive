import React from 'react';
import { supabase } from '../../lib/supabase';
import Button from '../ui/Button'

const OffersManagement = () => {
  const [offers, setOffers] = React.useState([]);
  const [showForm, setShowForm] = React.useState(false)
  const [editingOffer, setEditingOffer] = React.useState(null)
  const [formValues, setFormValues] = React.useState({
    name: '',
    discount_percent: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    applies_to: 'all',
  })

  React.useEffect(() => {
    const loadOffers = async () => {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error) setOffers(data);
    };
    loadOffers();
  }, []); // Add supabase to dependency array

  const handleSave = async () => {
    // Validation: check for overlap
    const overlap = offers.some(o =>
      o.id !== editingOffer?.id &&
      ((formValues.start_date <= o.end_date && formValues.end_date >= o.start_date) &&
       (formValues.start_time <= o.end_time && formValues.end_time >= o.start_time))
    )
    if (overlap) {
      alert('Offer overlaps/conflicts with an existing offer!')
      return
    }
    if (editingOffer) {
      await supabase.from('offers').update(formValues).eq('id', editingOffer.id)
    } else {
      await supabase.from('offers').insert(formValues)
    }
    setShowForm(false)
    setEditingOffer(null)
    setFormValues({ name: '', discount_percent: '', start_date: '', end_date: '', start_time: '', end_time: '', applies_to: 'all' })
    // Reload offers
    const { data } = await supabase.from('offers').select('*').order('created_at', { ascending: false })
    setOffers(data)
  }

  const handleEdit = (offer) => {
    setEditingOffer(offer)
    setFormValues(offer)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    await supabase.from('offers').delete().eq('id', id)
    setOffers(offers.filter(o => o.id !== id))
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Manage Offers</h2>
      <div className="grid gap-4">
        <Button onClick={() => setShowForm(true)}>Add Offer</Button>
        {showForm && (
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <input value={formValues.name} onChange={e => setFormValues({ ...formValues, name: e.target.value })} placeholder="Offer Name" className="border rounded px-2 py-1 mb-2 w-full" />
            <input value={formValues.discount_percent} onChange={e => setFormValues({ ...formValues, discount_percent: e.target.value })} placeholder="Discount %" type="number" className="border rounded px-2 py-1 mb-2 w-full" />
            <input value={formValues.start_date} onChange={e => setFormValues({ ...formValues, start_date: e.target.value })} placeholder="Start Date" type="date" className="border rounded px-2 py-1 mb-2 w-full" />
            <input value={formValues.end_date} onChange={e => setFormValues({ ...formValues, end_date: e.target.value })} placeholder="End Date" type="date" className="border rounded px-2 py-1 mb-2 w-full" />
            <input value={formValues.start_time} onChange={e => setFormValues({ ...formValues, start_time: e.target.value })} placeholder="Start Time" type="time" className="border rounded px-2 py-1 mb-2 w-full" />
            <input value={formValues.end_time} onChange={e => setFormValues({ ...formValues, end_time: e.target.value })} placeholder="End Time" type="time" className="border rounded px-2 py-1 mb-2 w-full" />
            <select value={formValues.applies_to} onChange={e => setFormValues({ ...formValues, applies_to: e.target.value })} className="border rounded px-2 py-1 mb-2 w-full">
              <option value="all">Entire Bill</option>
              <option value="products">Specific Products</option>
              <option value="combos">Specific Combos</option>
            </select>
            <div className="flex space-x-2">
              <Button onClick={handleSave}>{editingOffer ? 'Update' : 'Save'}</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        )}
        {offers.map(offer => (
          <div key={offer.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{offer.name}</h3>
              <p>Discount: {offer.discount_percent}%</p>
              <p>{offer.start_date} to {offer.end_date} ({offer.start_time}-{offer.end_time})</p>
            </div>
            <div className="space-x-2">
              <Button size="sm" onClick={() => handleEdit(offer)}>Edit</Button>
              <Button size="sm" variant="danger" onClick={() => handleDelete(offer.id)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OffersManagement;