import * as EPATH from './epath';
import { Types as DataTypes } from './data-types';
import { MessageRouter, Services } from './message-router';
import * as UnconnectedSend from './unconnected-send';
import * as util from './util';
import {
    ConnectionManager,
    Owner,
    ConnectionType,
    Priority,
    FixedVar,
    TimePerTick,
    TimeoutMultiplier,
} from './connection-manager';

const connManagerEnums = {
    Owner,
    ConnectionType,
    Priority,
    FixedVar,
    TimePerTick,
    TimeoutMultiplier,
};

export const cip = {
    EPATH,
    MessageRouter,
    Services,
    DataTypes,
    UnconnectedSend,
    util,
    ConnectionManager,
    connManagerEnums,
};
