import React from 'react';
import GenericAdminGrid from 'components/grids/GenericAdminGrid';
import { deleteEvent, listEvent } from 'services/eventService';
import EventForm from 'components/forms/EventForm';


export const EventAdminGrid = () => (
  <GenericAdminGrid 
    name="event"
    onLoadList={listEvent}
    onDelete={deleteEvent}
    cardEditorComponent={EventForm}
  />
);

EventAdminGrid.propTypes = {};

EventAdminGrid.defaultProps = {};

export default EventAdminGrid;
