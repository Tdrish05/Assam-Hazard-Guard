export type TranslationKey =
  | 'nav_map'
  | 'nav_shelters'
  | 'nav_report'
  | 'nav_history'
  | 'sidebar_title'
  | 'sidebar_subtitle'
  | 'btn_gps_route'
  | 'gps_fetching'
  | 'tab_alerts'
  | 'tab_shelters'
  | 'tab_trends'
  | 'feed_instruction'
  | 'stat_critical'
  | 'stat_warnings'
  | 'stat_advisories'
  | 'stat_active'
  | 'map_layers'
  | 'layer_rain'
  | 'layer_flood'
  | 'layer_quake'
  | 'layer_fire'
  | 'evac_router_title'
  | 'evac_routing_for'
  | 'evac_closest_camps'
  | 'occupancy_status'
  | 'food_ration'
  | 'medical_kit'
  | 'backup_power'
  | 'report_title'
  | 'report_subtitle'
  | 'step_details'
  | 'step_pin'
  | 'step_confirm'
  | 'hazard_cat'
  | 'hazard_desc'
  | 'select_town'
  | 'select_locality'
  | 'btn_choose_loc'
  | 'btn_back'
  | 'btn_review'
  | 'btn_submit';

export const translations: Record<'en' | 'as', Record<TranslationKey, string>> = {
  en: {
    nav_map: 'Live Hazard Map',
    nav_shelters: 'Relief Camps',
    nav_report: 'Log Incident',
    nav_history: 'History Directory',
    sidebar_title: 'Assam Hazard Guard',
    sidebar_subtitle: 'Automated Emergency Warning Console',
    btn_gps_route: 'Route Safe Path from My Location',
    gps_fetching: 'Fetching GPS Coordinates...',
    tab_alerts: 'Alerts Feed',
    tab_shelters: 'Safe Shelters',
    tab_trends: 'Live Trends',
    feed_instruction: 'Click an alert card to calculate routes to safe shelters.',
    stat_critical: 'Critical',
    stat_warnings: 'Warnings',
    stat_advisories: 'Advisories',
    stat_active: 'Active Threats',
    map_layers: 'Map Layers',
    layer_rain: 'Rain & Forecast Badges',
    layer_flood: 'Active Flood Risk Basins',
    layer_quake: 'Seismic epicenters (USGS)',
    layer_fire: 'Forest Fire Hazard Index',
    evac_router_title: 'Geospatial Evacuation Router',
    evac_routing_for: 'Routing Evacuations For:',
    evac_closest_camps: 'Closest Safe Camps',
    occupancy_status: 'Occupancy Status',
    food_ration: 'Food ration:',
    medical_kit: 'Medical kit:',
    backup_power: 'Backup power:',
    report_title: 'Submit Community Hazard Report',
    report_subtitle: 'Witnessed an active roadblock, local flood waterlogging, or power grid issue? Report it to alert fellow citizens.',
    step_details: '1. Details',
    step_pin: '2. Pin Location',
    step_confirm: '3. Confirm',
    hazard_cat: 'Select Hazard Category',
    hazard_desc: 'Describe the Incident',
    select_town: 'Select Town / District',
    select_locality: 'Select Area / Locality / Village',
    btn_choose_loc: 'Choose Location',
    btn_back: 'Back',
    btn_review: 'Review Summary',
    btn_submit: 'Confirm & Submit'
  },
  as: {
    nav_map: 'সক্ৰিয় বিপদৰ মানচিত্ৰ',
    nav_shelters: 'আশ্ৰয় শিবিৰসমূহ',
    nav_report: 'বিপদৰ খবৰ দিয়ক',
    nav_history: 'ঘটনাৰ ইতিহাস',
    sidebar_title: 'অসম বিপদ ৰক্ষক',
    sidebar_subtitle: 'জৰুৰীকালীন সতৰ্কবাণী নিয়ন্ত্ৰণ কক্ষ',
    btn_gps_route: 'মোৰ স্থানৰ পৰা সুৰক্ষিত পথ বাছক',
    gps_fetching: 'GPS স্থানাংক গ্ৰহণ কৰি থকা হৈছে...',
    tab_alerts: 'সতৰ্কবাণীসমূহ',
    tab_shelters: 'নিৰাপদ শিবিৰ',
    tab_trends: 'সক্ৰিয় ধাৰা',
    feed_instruction: 'আশ্ৰয় শিবিৰলৈ যাবলৈ যিকোনো এটা কাৰ্ডত ক্লিক কৰক।',
    stat_critical: 'জৰুৰী',
    stat_warnings: 'সতৰ্কবাণী',
    stat_advisories: 'পৰামৰ্শ',
    stat_active: 'সক্ৰিয় বিপদ',
    map_layers: 'মানচিত্ৰৰ তৰপসমূহ',
    layer_rain: 'বৰষুণ আৰু বতৰৰ আগলি খবৰ',
    layer_flood: 'বানপানীৰ আশংকাপূৰ্ণ অঞ্চল',
    layer_quake: 'ভূমিকম্পৰ কেন্দ্ৰবিন্দু (USGS)',
    layer_fire: 'বনজুইৰ আশংকা সূচক',
    evac_router_title: 'সুৰক্ষিত স্থানান্তৰণ পথনিৰ্দেশক',
    evac_routing_for: 'স্থানান্তৰণ পথ গণনা কৰা হৈছে:',
    evac_closest_camps: 'উচৰৰ নিৰাপদ আশ্ৰয় শিবিৰ',
    occupancy_status: 'আশ্ৰয়প্ৰাপ্ত লোকৰ সংখ্যা',
    food_ration: 'খাদ্য সামগ্ৰী:',
    medical_kit: 'চিকিৎসা সেৱা:',
    backup_power: 'বিদ্যুৎ যোগান:',
    report_title: 'ৰাইজৰ বিপদ সংক্ৰান্তিয় প্ৰতিবেদন',
    report_subtitle: 'কোনো পথ বন্ধ, বানপানী বা বিদ্যুৎ ব্যাহত হোৱা প্ৰত্যক্ষ কৰিছে নেকি? ৰাইজক সতৰ্ক কৰিবলৈ তথ্য জমা কৰক।',
    step_details: '১. বিৱৰণ',
    step_pin: '২. স্থান নিৰ্ধাৰণ',
    step_confirm: '৩. নিশ্চিত কৰক',
    hazard_cat: 'বিপদৰ বিভাগ বাছক',
    hazard_desc: 'ঘটনাটোৰ সविशेष বৰ্ণনা কৰক',
    select_town: 'চহৰ / জিলা বাছক',
    select_locality: 'অঞ্চল / গাওঁ বাছক',
    btn_choose_loc: 'স্থান বাছক',
    btn_back: 'পাছলৈ',
    btn_review: 'পৰ্যালোচনা কৰক',
    btn_submit: 'নিশ্চিত কৰি জমা কৰক'
  }
};
