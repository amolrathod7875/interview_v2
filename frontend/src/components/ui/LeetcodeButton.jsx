import styled from "styled-components"

const LeetcodeButton = ({ link, disabled }) => {
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
          {/* LeetCode SVG */}
          <svg
            viewBox="0 0 24 24"
            fill="white"
            width="22"
            height="22"
          >
            <path d="M16.102 17.49l-3.095 3.095c-.781.781-2.047.781-2.828 0l-5.657-5.657c-.781-.781-.781-2.047 0-2.828l5.657-5.657c.781-.781 2.047-.781 2.828 0l1.414 1.414-1.414 1.414-1.414-1.414-5.657 5.657 5.657 5.657 3.095-3.095 1.414 1.414zm1.414-1.414l1.414-1.414-1.414-1.414-1.414 1.414 1.414 1.414z" />
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

  /* Visible face */
  .svgContainer {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  background: #f59e0b;     /* ⬛ black main square */
  border-radius: 10px;
  border: none;

  transition: all 0.3s ease;
  z-index: 1;
}
 

  /* Hover layer */
  .BG {
    position: absolute;
    width: 100%;
    height: 100%;
    background: #f59e0b;
    z-index: 0;
    border-radius: 10px;
    transition: all 0.3s ease;
  }

  .Btn:not(.disabled):hover .BG {
    transform: rotate(35deg);
    transform-origin: bottom;
  }

  .Btn:not(.disabled):hover .svgContainer {
    background-color: rgba(245, 158, 11, 0.25);
    backdrop-filter: blur(4px);
  }
`

export default LeetcodeButton
