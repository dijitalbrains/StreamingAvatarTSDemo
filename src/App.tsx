/**
 * Very basic react demo of how to use the HeyGen Streaming Avatar SDK
 */
import { useEffect, useRef, useState } from "react";
import {
  Configuration,
  NewSessionData,
  StreamingAvatarApi,
} from "@heygen/streaming-avatar";
import "./App.css";
import axios from "axios";

function App() {
  const [stream, setStream] = useState<MediaStream>();
  const [debug, setDebug] = useState<string>();
  const avatar = useRef<StreamingAvatarApi | null>(null);

  const [text, setText] = useState<string>("");
  const avatarInitialized = useRef(false);
  const [avatarId, setAvatarId] = useState<string>(
    "Angela-inblackskirt-20220820"
  );
  const [voiceId, setVoiceId] = useState<string>(
    "143bd1b36805478893715b53376e6803"
  );
  const sessionId = useRef<string | undefined>("");

  const [data, setData] = useState<NewSessionData>();
  const mediaStream = useRef<HTMLVideoElement>(null);
  const [isPlayButtonVisible, setIsPlayButtonVisible] = useState(true);
  const [isSpeakButtonVisible, setIsSpeakButtonVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // State to track loading

  const fetchAccessToken = async () => {
    try {
      const response = await axios.post(
        "https://api.heygen.com/v1/streaming.create_token",
        {},
        {
          headers: {
            "X-Api-Key": process.env.REACT_APP_HEYGEN_API_KEY_DALLAS, // Replace with your actual API key
          },
        }
      );

      return response.data.data.token;
    } catch (error) {
      if (error instanceof Error) {
        setDebug(`Error fetching access token: ${error.message}`);
      } else {
        setDebug(`Error fetching access token: ${String(error)}`);
      }
      return null;
    }
  };

  const initializeAvatarApi = async () => {
    if (avatarInitialized.current) return;

    avatarInitialized.current = true;

    const token = await fetchAccessToken();

    if (token) {
      avatar.current = new StreamingAvatarApi(
        new Configuration({
          accessToken: token,
        })
      );
    }

    // grab(); // because we added a button to initialize avatar
  };

  async function grab() {
    setIsLoading(true); // Set loading state to true
    try {
      if (!avatar.current) return;
      const res = await avatar.current.createStartAvatar(
        {
          newSessionRequest: {
            quality: "low",
            avatarName: avatarId,
            voice: { voiceId: voiceId },
          },
        },
        setDebug
      );
      setData(res);
      console.log(res);
      sessionId.current = res.sessionId;
      setStream(avatar.current.mediaStream);

      setIsPlayButtonVisible(false); // Hide the button after grabbing
      setIsSpeakButtonVisible(true); // Hide the button after grabbing
      webhookSpeak();

      // await avatar.current
      //   .speak({
      //     taskRequest: {
      //       text: "Living here for the last 10 years and specializing in Bridgeview Condominiums for sale, I have the insider information of all new listings and will update you in real time as I know of them.",
      //       sessionId: data?.sessionId,
      //     },
      //   })
      //   .catch((e) => {
      //     setDebug(e.message);
      //   });
    } catch (error) {
    } finally {
      setIsLoading(false); // Set loading state to false
    }
  }

  async function stop() {
    if (!avatar.current) return;
    await avatar.current.stopAvatar(
      { stopSessionRequest: { sessionId: data?.sessionId } },
      setDebug
    );
  }

  useEffect(() => {
    if (!avatar.current) {
      initializeAvatarApi();
    }

    if (stream && mediaStream.current) {
      mediaStream.current.srcObject = stream;
      mediaStream.current.onloadedmetadata = () => {
        mediaStream.current!.play();
        setDebug("Playing");
      };
    }
  }, [mediaStream, stream]);

  async function handleSpeak() {
    if (!avatar.current) return;
    setIsLoading(true);

    await avatar.current
      .speak({
        taskRequest: {
          text: "Living here for the last 10 years and specializing in Bridgeview Condominiums for sale, I have the insider information of all new listings and will update you in real time as I know of them.",
          sessionId: data?.sessionId,
        },
      })
      .catch((e) => {
        setDebug(e.message);
      });

    setIsLoading(false);
  }

  async function webhookSpeak() {
    setIsLoading(true);
    console.log(sessionId.current);

    try {
      await axios.post("https://dev-theportal.xyzlabs.org/api/avatar/speak", {
        session_id: sessionId.current,
        text: "Living here for the last 10 years and specializing in Bridgeview Condominiums for sale, I have the insider information of all new listings and will update you in real time as I know of them.",
      });
    } catch (error) {
      console.error("Error making avatar speak:", error);
    }

    setIsLoading(false);
  }

  function handleButtonClick(): void {
    grab();
  }

  return (
    <div className="HeyGenStreamingAvatar">
      <header>
        {/* <p>{debug}</p>
        <div className="LabelPair">
          <label>Avatar ID </label>
          <input
            className="InputField2"
            placeholder="Avatar ID"
            value={avatarId}
            onChange={(v) => setAvatarId(v.target.value)}
          />
        </div>
        <div className="LabelPair">
          <label>Voice ID</label>
          <input
            className="InputField2"
            placeholder="Voice ID"
            value={voiceId}
            onChange={(v) => setVoiceId(v.target.value)}
          />
        </div> */}
        {/* <div className="Actions"> */}
        {/* <input
            className="InputField"
            placeholder="Type something for the avatar to say"
            value={text}
            onChange={(v) => setText(v.target.value)}
          /> */}
        {/* {isSpeakButtonVisible && (
          <button
            style={{
              cursor: isLoading ? "not-allowed" : "pointer",
              marginBottom: "10px",
            }}
            onClick={handleSpeak}
          >
            {isLoading ? "Loading..." : "Speak"}
          </button>
        )} */}
        {/* <button onClick={grab}>Start</button> */}
        {/* <button onClick={stop}>Stop</button> */}
        {/* </div> */}
        {isPlayButtonVisible && (
          <button
            onClick={(v) => handleButtonClick()}
            disabled={isLoading}
            style={{ cursor: isLoading ? "not-allowed" : "pointer" }}
          >
            {isLoading ? "Loading..." : "Initialize Avatar"}
          </button>
        )}
        <div>
          <video playsInline autoPlay width={500} ref={mediaStream}></video>
        </div>
      </header>
    </div>
  );
}

export default App;
