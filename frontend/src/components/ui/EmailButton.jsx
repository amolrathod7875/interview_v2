import styled from "styled-components"

const EmailButton = ({ email, disabled }) => {
  const handleClick = () => {
    if (disabled) return
    window.location.href = `mailto:${email}`
  }

  return (
    <StyledWrapper>
      <button
        className={`Btn ${disabled ? "disabled" : ""}`}
        onClick={handleClick}
        disabled={disabled}
      >
        <span className="svgContainer">
          {/* Mail icon */}
          <svg
            viewBox="0 0 24 24"
            fill="white"
            width="20"
            height="20"
          >
            <path d="M2 4h20v16H2V4zm10 7L4 6v12h16V6l-8 5z" />
          </svg>
        </span>
        <span className="BG" />
      </button>
    </StyledWrapper>
  )
}

const StyledWrapper = styled.div`
  .Btn {
    width: 45px;
    height: 45px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background-color: transparent;
    position: relative;
    border-radius: 7px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .Btn.disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .svgContainer {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    background: #696060ff;   /* ⬛ black like others */
    border-radius: 10px;
    border: none;

    transition: all 0.3s ease;
    z-index: 1;
  }

  .BG {
    position: absolute;
    width: 100%;
    height: 100%;
    background: #696060ff;   /* 🔵 mail blue accent */
    z-index: 0;
    border-radius: 10px;
    transition: all 0.3s ease;
  }

  .Btn:not(.disabled):hover .BG {
    transform: rotate(35deg);
    transform-origin: bottom;
  }

  .Btn:not(.disabled):hover .svgContainer {
    background-color: rgba(59, 130, 246, 0.25); /* 🔵 light blue glow */
    backdrop-filter: blur(4px);
  }
`

export default EmailButton
