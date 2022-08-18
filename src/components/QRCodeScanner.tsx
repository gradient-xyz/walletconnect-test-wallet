import * as React from "react";
import styled from "styled-components";
import QrReader from "react-qr-reader";
import { useState } from "react";

const SQRCodeScannerContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 5;
  margin: 0 auto !important;
  background: rgb(0, 0, 0);
`;

const SQRCodeScannerWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const SCloseButton = styled.div`
  transition: all 0.2s ease-in-out;
  width: 25px;
  height: 25px;
  position: absolute;
  z-index: 10;
  top: 15px;
  right: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(45deg);
  &:hover {
    opacity: 0.5;
  }
`;

const SFirstLine = styled.div`
  position: absolute;
  width: 90%;
  border: 1px solid rgb(255, 255, 255);
`;

const SSecondLine = styled(SFirstLine as any)`
  transform: rotate(90deg);
`;

export interface IQRCodeValidateResponse {
  error: Error | null;
  result: any | null;
}

interface IQRCodeScannerProps {
  onValidate: (data: string) => IQRCodeValidateResponse;
  onScan: (data: any) => void;
  onError: (error: Error) => void;
  onClose: () => void;
}

interface IQRCodeScannerState {
  delay: number | false;
}

const QRCodeScanner = (props: IQRCodeScannerProps) => {
  const [state, setState] = useState<IQRCodeScannerState>({
    delay: 300,
  });

  const stopRecording = () => {
    setState({ delay: false });
  };

  const handleScan = (data: string) => {
    if (data) {
      const { result, error } = props.onValidate(data);
      if (result) {
        stopRecording();
        props.onScan(result);
      } else {
        handleError(error);
      }
    }
  };

  const handleError = (error: Error | null) => {
    if (error) {
      props.onError(error);
    }
  };

  const onClose = () => {
    try {
      stopRecording();
      props.onClose();
    } catch (error) {
      handleError(error);
    }
  };

  React.useEffect(() => {
    return () => stopRecording();
  });

  return (
    <SQRCodeScannerContainer>
      <SCloseButton onClick={onClose}>
        <SFirstLine />
        <SSecondLine />
      </SCloseButton>
      <SQRCodeScannerWrapper>
        <QrReader
          delay={state.delay}
          onError={handleError}
          onScan={handleScan}
          style={{ width: "100%" }}
        />
      </SQRCodeScannerWrapper>
    </SQRCodeScannerContainer>
  );
};

export default QRCodeScanner;
