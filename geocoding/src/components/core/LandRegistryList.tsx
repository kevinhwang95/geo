import { useGenericCrud } from '@/hooks/useGenericCrud';
import type LandRegistry from '@/types/landRegistry.type';

export const LandRegistryList = () => {
  const { data: lands, loading, error, createItem, updateItem, deleteItem } = useGenericCrud<LandRegistry>('lands');

  if (loading) return <div>Loading posts...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const handleCreate = () => {
    createItem({
      land_name: 'New Post Title',
      land_code: 'This is the body of a new post.',
      land_number: 'New Post Body',
      size: 123,  
      location: 'Location',
      province: 'Province',
      district: 'District',
      city: 'City',
      owner: 'Owner',
      coordinations: 'Coordinations',
      planttypeid: 1,
      categoryid: 1,
      plant_date: new Date(),
      harvest_cycle: 'Harvest Cycle',
      notes: 'Some notes',
      created: new Date(),
      createdby: 'Admin',
      
    });
  };

  const handleUpdate = (id: number) => {
    updateItem(id, {
      land_name: 'Updated Post Title',
    });
  };

  const handleDelete = (id: number) => {
    deleteItem(id);
  };

  return (
    <div>
      <h1>Lands</h1>
      <button onClick={handleCreate}>Add New Land</button>
      <ul>
        {lands && lands.map((land) => (
          <li key={land.id}>
            <h3>{land.land_name}</h3>
            <p>{land.land_code}</p>
            <p>{land.land_number}</p>
            <p>{land.size}</p>
            <p>{land.location}</p>
            <p>{land.province}</p>
            <p>{land.district}</p>
            <p>{land.city}</p>
            <p>{land.owner}</p>
            <p>{land.coordinations}</p>
            <p>{land.planttypeid}</p>
            <p>{land.categoryid}</p>
            <p>{land.plant_date instanceof Date ? land.plant_date.toLocaleDateString() : land.plant_date}</p>
            <p>{land.harvest_cycle}</p>
            <p>{land.notes}</p>
            <p>{land.created instanceof Date ? land.created.toLocaleDateString() : land.created}</p>
            <p>{land.createdby}</p>
            <button onClick={() => handleUpdate(land.id)}>Update</button>
            <button onClick={() => handleDelete(land.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};
