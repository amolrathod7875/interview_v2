import styled from "styled-components"

const GithubButton = ({ link, disabled }) => {
  const handleClick = () => {
    if (disabled) return
    window.open(
      link.startsWith("http") ? link : `https://${link}`,
      "_blank"
    )
  }

  return (
    <StyledWrapper>
      <button
        className={`Btn ${disabled ? "disabled" : ""}`}
        onClick={handleClick}
        disabled={disabled}
      >
        <span className="svgContainer">
          <svg
            fill="white"
            viewBox="0 0 496 512"
            height="1.6em"
          >
            <path d="M244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8..." />
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
    backdrop-filter: blur(0px);
    border-radius: 10px;
    transition: all 0.3s ease;
    border: 1px solid rgba(156, 156, 156, 0.466);
    z-index: 1;
  }

  .BG {
    position: absolute;
    width: 100%;
    height: 100%;
    background: #181818;
    z-index: 0;
    border-radius: 10px;
    transition: all 0.3s ease;
  }

  .Btn:not(.disabled):hover .BG {
    transform: rotate(35deg);
    transform-origin: bottom;
  }

  .Btn:not(.disabled):hover .svgContainer {
    background-color: rgba(156, 156, 156, 0.3);
    backdrop-filter: blur(4px);
  }
`

export default GithubButton

