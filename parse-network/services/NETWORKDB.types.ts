
export type MonStop = {
    id: string;
    name: string;
    short_name: string;
    tts_name: string;
    lat: string;
    lon: string;
    locality: string;
    parish_id: string;
    parish_name: string;
    municipality_id: string;
    municipality_name: string;
    district_id: string;
    district_name: string;
    region_id: string;
    region_name: string;
    wheelchair_boarding: string;
    facilities: string[];
    lines: string[];
    routes: string[];
    patterns: string[];
};

export type MonPeriod = {
    id: string;
    name: string;
    dates: string[];
    valid: {
        from: string;
        until?: string;
    }[];
}