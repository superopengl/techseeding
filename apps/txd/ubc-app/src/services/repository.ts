import { createConnection, getRepository, getConnectionManager } from 'typeorm';
import { Gallery } from '../entity/Gallery';
import { Business } from '../entity/Business';
import { Event } from '../entity/Event';
import { Image } from '../entity/Image';
import { Poster } from '../entity/Poster';
import { SysLog } from '../entity/SysLog';


// const defaultConnection = getConnectionManager().get('default');
// const getRepository = defaultConnection.getRepository;

export const sysLogRepository = getRepository(SysLog);
export const galleryRepository = getRepository(Gallery);
export const businessRepository = getRepository(Business);
export const eventRepository = getRepository(Event);
export const imageRepository = getRepository(Image);
export const posterRepository = getRepository(Poster);

