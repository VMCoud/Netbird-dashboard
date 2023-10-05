import {
  Peer,
  PeerIPToID,
  PeerIPToName,
  PeerNameToIP,
} from "../store/peer/types";
import { Route } from "../store/route/types";

export const routePeerSeparator = " - ";

export const masqueradeDisabledMSG =
  "访问目标网络 CIDR 时，启用此选项可隐藏路由对等本地地址后面的其他 NetBird 网络 IP。该选项允许访问您的私人网络，而无需在本地路由器或其他设备上配置路由。";

export const masqueradeEnabledMSG =
  "禁用此选项后，在访问目标网络 CIDR 时，将不再隐藏来自路由对等网络本地地址后面的其他 NetBird 对等网络的所有流量。您需要在本地路由器或其他设备上为 NetBird 网络配置指向路由对等网络的路由。";

export const peerToPeerIP = (name: string, ip: string): string => {
  return name + routePeerSeparator + ip;
};

export const initPeerMaps = (
  peers: Peer[]
): [PeerNameToIP, PeerIPToName, PeerIPToID] => {
  let peerNameToIP = {} as PeerNameToIP;
  let peerIPToName = {} as PeerIPToName;
  let peerIPToID = {} as PeerIPToID;
  peers.forEach((p) => {
    peerNameToIP[p.name] = p.ip;
    peerIPToName[p.ip] = p.name;
    peerIPToID[p.ip] = p.id ? p.id : "";
  });
  return [peerNameToIP, peerIPToName, peerIPToID];
};

export interface RouteDataTable extends Route {
  key: string;
  peer_ip: string;
  peer_name: string;
  peer_groups: Array<string>;
}

export interface GroupedDataTable {
  key: string;
  network_id: any;
  network: string;
  enabled: boolean;
  masquerade: boolean;
  description: string;
  routesCount: number;
  groupedRoutes: RouteDataTable[];
  routesGroups: string[];
  peer_groups?: Array<string>;
}

export const transformDataTable = (
  routes: Route[],
  peers: Peer[]
): RouteDataTable[] => {
  let peerMap = Object.fromEntries(peers.map((p) => [p.id, p]));
  return routes.map((route) => {
    return {
      key: route.id,
      ...route,
      peer: route.peer,
      peer_ip: peerMap[route.peer] ? peerMap[route.peer].ip : route.peer,
      peer_name: peerMap[route.peer] ? peerMap[route.peer].name : route.peer,
    } as RouteDataTable;
  });
};

export const transformGroupedDataTable = (
  routes: Route[],
  peers: Peer[]
): GroupedDataTable[] => {
  let keySet = new Set(
    routes.map((r) => {
      return r.network_id + r.network;
    })
  );

  let groupedRoutes: GroupedDataTable[] = [];

  keySet.forEach((p) => {
    let hasEnabled = false;
    let lastRoute: Route;
    let listedRoutes: Route[] = [];
    let groupList: string[] = [];
    routes.forEach((r) => {
      if (p === r.network_id + r.network) {
        lastRoute = r;
        if (r.enabled) {
          hasEnabled = true;
        }
        listedRoutes.push(r);
        groupList = groupList.concat(r.groups);
      }
    });
    groupList = groupList.filter(
      (value, index, arrary) => arrary.indexOf(value) === index
    );
    let groupDataTableRoutes = transformDataTable(listedRoutes, peers);
    const filterEnabledRoutes = groupDataTableRoutes.filter(
      (route) => route.enabled
    );
    groupedRoutes.push({
      key: p.toString(),
      network_id: lastRoute!.network_id,
      network: lastRoute!.network,
      masquerade: lastRoute!.masquerade,
      description: lastRoute!.description,
      enabled: hasEnabled,
      routesCount: filterEnabledRoutes.length,
      groupedRoutes: groupDataTableRoutes,
      routesGroups: groupList,
      peer_groups: lastRoute!.peer_groups,
    });
  });
  return groupedRoutes;
};
