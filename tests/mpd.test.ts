import { describe, expect, test } from "bun:test";

import { getManifestWithBestBandwidth } from "../src/libs/converters/mpd/parser";

describe("load MPD Manifest", () => {
  // test("test segmented", async () => {
  //   const content = `<?xml version="1.0" encoding="utf-8"?>
  //   <MPD xmlns="urn:mpeg:dash:schema:mpd:2011" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="urn:mpeg:DASH:schema:MPD:2011 http://standards.iso.org/ittf/PubliclyAvailableStandards/MPEG-DASH_schema_files/DASH-MPD.xsd" profiles="urn:mpeg:dash:profile:isoff-live:2011" type="static" mediaPresentationDuration="PT23M19.3S" minBufferTime="PT2S">
  //     <BaseURL>https://epic-developer-community.qstv.on.epicgames.com/d8adce02-3dab-4820-b5cc-70cb0a7a00a6/</BaseURL>
  //     <ProgramInformation></ProgramInformation>
  //     <Period id="0" start="PT0S">
  //       <AdaptationSet id="0" contentType="video" lang="eng" segmentAlignment="true" bitstreamSwitching="true">
  //         <Representation id="0" bandwidth="2750000" width="1152" height="648" frameRate="30000/1001" mimeType="video/mp4" codecs="avc1.64081f">
  //           <SegmentTemplate duration="2000000" timescale="1000000" initialization="init_$RepresentationID$.mp4" media="segment_$RepresentationID$_$Number$.m4s" startNumber="1"></SegmentTemplate>
  //         </Representation>
  //         <Representation id="1" bandwidth="6000000" width="1920" height="1080" frameRate="30000/1001" mimeType="video/mp4" codecs="avc1.640828">
  //           <SegmentTemplate duration="2000000" timescale="1000000" initialization="init_$RepresentationID$.mp4" media="segment_$RepresentationID$_$Number$.m4s" startNumber="1"></SegmentTemplate>
  //         </Representation>
  //         <Representation id="2" bandwidth="4000000" width="1280" height="720" frameRate="30000/1001" mimeType="video/mp4" codecs="avc1.64081f">
  //           <SegmentTemplate duration="2000000" timescale="1000000" initialization="init_$RepresentationID$.mp4" media="segment_$RepresentationID$_$Number$.m4s" startNumber="1"></SegmentTemplate>
  //         </Representation>
  //         <Representation id="3" bandwidth="1250000" width="896" height="504" frameRate="30000/1001" mimeType="video/mp4" codecs="avc1.64081f">
  //           <SegmentTemplate duration="2000000" timescale="1000000" initialization="init_$RepresentationID$.mp4" media="segment_$RepresentationID$_$Number$.m4s" startNumber="1"></SegmentTemplate>
  //         </Representation>
  //         <Representation id="4" bandwidth="750000" width="640" height="360" frameRate="30000/1001" mimeType="video/mp4" codecs="avc1.64081e">
  //           <SegmentTemplate duration="2000000" timescale="1000000" initialization="init_$RepresentationID$.mp4" media="segment_$RepresentationID$_$Number$.m4s" startNumber="1"></SegmentTemplate>
  //         </Representation>
  //         <Representation id="5" bandwidth="500000" width="512" height="288" frameRate="30000/1001" mimeType="video/mp4" codecs="avc1.640815">
  //           <SegmentTemplate duration="2000000" timescale="1000000" initialization="init_$RepresentationID$.mp4" media="segment_$RepresentationID$_$Number$.m4s" startNumber="1"></SegmentTemplate>
  //         </Representation>
  //       </AdaptationSet>
  //       <AdaptationSet id="1" contentType="audio" lang="eng" segmentAlignment="true" bitstreamSwitching="true">
  //         <Representation id="6" audioSamplingRate="44100" bandwidth="128000" mimeType="audio/mp4" codecs="mp4a.40.2">
  //           <SegmentTemplate duration="2000000" timescale="1000000" initialization="init_$RepresentationID$.mp4" media="segment_$RepresentationID$_$Number$.m4s" startNumber="1"></SegmentTemplate>
  //           <AudioChannelConfiguration schemeIdUri="urn:mpeg:dash:23003:3:audio_channel_configuration:2011" value="2"></AudioChannelConfiguration>
  //         </Representation>
  //       </AdaptationSet>
  //     </Period>
  //   </MPD>`;

  //   const manifest = await getManifestWithBestBandwidth(content, "");

  //   expect(manifest).toEqual([
  //     {
  //       allowCache: true,
  //       discontinuityStarts: [],
  //       dateRanges: [],
  //       segments: [],
  //     },
  //     false,
  //   ]);
  // });
  test("test m4a", async () => {
    // https://dash.akamaized.net/dash264/TestCases/1a/sony/DASH_vodvideo_Track3.m4v
    const content = `<?xml version="1.0" encoding="UTF-8"?><MPD xmlns="urn:mpeg:dash:schema:mpd:2011" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" maxSubsegmentDuration="PT5.0S" mediaPresentationDuration="PT9M57S" minBufferTime="PT5.0S" profiles="urn:mpeg:dash:profile:isoff-on-demand:2011,http://xmlns.sony.net/metadata/mpeg/dash/profile/senvu/2012" type="static" xsi:schemaLocation="urn:mpeg:dash:schema:mpd:2011 DASH-MPD.xsd">
      <Period duration="PT9M57S" id="P1">
        <!-- Adaptation Set for main audio -->
        <AdaptationSet audioSamplingRate="48000" codecs="mp4a.40.5" contentType="audio" group="2" id="2" lang="en" mimeType="audio/mp4" subsegmentAlignment="true" subsegmentStartsWithSAP="1">
          <AudioChannelConfiguration schemeIdUri="urn:mpeg:dash:23003:3:audio_channel_configuration:2011" value="2"/>
          <Role schemeIdUri="urn:mpeg:dash:role:2011" value="main"/>
          <Representation bandwidth="64000" id="2_1">
            <BaseURL>DASH_vodaudio_Track5.m4a</BaseURL>
          </Representation>
        </AdaptationSet>
        <!-- Adaptation Set for video -->
        <AdaptationSet codecs="avc1.4D401E" contentType="video" frameRate="24000/1001" group="1" id="1" maxBandwidth="1609728" maxHeight="480" maxWidth="854" maximumSAPPeriod="5.0" mimeType="video/mp4" minBandwidth="452608" minHeight="480" minWidth="854" par="16:9" sar="1:1" subsegmentAlignment="true" subsegmentStartsWithSAP="1">
          <Role schemeIdUri="urn:mpeg:dash:role:2011" value="main"/>
          <Representation bandwidth="1005568" height="480" id="1_1" mediaStreamStructureId="1" width="854">
            <BaseURL>DASH_vodvideo_Track2.m4v</BaseURL>
          </Representation>
          <Representation bandwidth="1609728" height="480" id="1_2" mediaStreamStructureId="1" width="854">
            <BaseURL>DASH_vodvideo_Track1.m4v</BaseURL>
          </Representation>
          <Representation bandwidth="704512" height="480" id="1_3" mediaStreamStructureId="1" width="854">
            <BaseURL>DASH_vodvideo_Track3.m4v</BaseURL>
          </Representation>
          <Representation bandwidth="452608" height="480" id="1_4" mediaStreamStructureId="1" width="854">
            <BaseURL>DASH_vodvideo_Track4.m4v</BaseURL>
          </Representation>
        </AdaptationSet>
      </Period>
    </MPD>`;

    const manifest = await getManifestWithBestBandwidth(
      content,
      "https://dash.akamaized.net/dash264/TestCases/1a/sony/SNE_DASH_SD_CASE1A_REVISED.mpd",
    );

    expect(manifest).toEqual([
      "https://dash.akamaized.net/dash264/TestCases/1a/sony//DASH_vodaudio_Track5.m4a",
      true,
    ]);
  });
});
